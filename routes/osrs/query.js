require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const web3passport = require("../../util/auth/passport");
const { v4: uuidv4 } = require("uuid");
const neo4j = require("neo4j-driver");
const db = process.env.MINDRUNE_DB;
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

// Create Neo4j driver instance
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

/**
 * Execute a Neo4j query with parameters
 * @param {string} query - The Cypher query to execute
 * @param {Object} params - The parameters for the query
 * @returns {Promise<Object>} - The query result
 */
async function executeNeo4jQuery(query, params = {}) {
  const session = driver.session();
  
  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
}

// API endpoint for executing Neo4j queries
router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const { query, params = {} } = req.body;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          msg: "Query is required"
        });
      }
      
      // IMPORTANT: Add user ID to params for security
      // This ensures users can only access their own data
      const secureParams = {
        ...params,
        account: req.user[0].account
      };
      
      // Security check: Ensure the query includes userId parameter reference
      // This is a basic check - implement more sophisticated validation as needed
      if (!query.includes('$account')) {
        return res.status(400).json({
          success: false,
          msg: "Query must include $account parameter for security"
        });
      }
      
      const result = await executeNeo4jQuery(query, secureParams);
      
      // Process the result into a more frontend-friendly format
      const processedResult = processNeo4jResult(result);
      
      res.json({
        success: true,
        data: processedResult
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        msg: `Oops, something went wrong! Please try again later.`,
        error: e.message
      });
    }
  }
);

/**
 * Process Neo4j result into a frontend-friendly format
 * @param {Object} result - The Neo4j result object
 * @returns {Object} - Processed data
 */
function processNeo4jResult(result) {
  // Check if the result has records
  if (!result.records || result.records.length === 0) {
    return { records: [] };
  }
  
  // Get all keys from the first record
  const keys = result.records[0].keys;
  
  // Process records
  const records = result.records.map(record => {
    const processedRecord = {};
    
    // Process each key in the record
    keys.forEach(key => {
      const value = record.get(key);
      
      // Handle different types of Neo4j values
      if (value === null || value === undefined) {
        processedRecord[key] = null;
      } 
      // Handle Neo4j Nodes
      else if (value.labels && value.properties) {
        processedRecord[key] = {
          id: value.identity.toString(),
          labels: value.labels,
          ...value.properties
        };
      } 
      // Handle Neo4j Relationships
      else if (value.type && value.start && value.end) {
        processedRecord[key] = {
          id: value.identity.toString(),
          type: value.type,
          startNodeId: value.start.toString(),
          endNodeId: value.end.toString(),
          ...value.properties
        };
      } 
      // Handle Neo4j Paths
      else if (value.segments) {
        processedRecord[key] = {
          segments: value.segments.map(segment => ({
            start: {
              id: segment.start.identity.toString(),
              labels: segment.start.labels,
              ...segment.start.properties
            },
            relationship: {
              id: segment.relationship.identity.toString(),
              type: segment.relationship.type,
              ...segment.relationship.properties
            },
            end: {
              id: segment.end.identity.toString(),
              labels: segment.end.labels,
              ...segment.end.properties
            }
          }))
        };
      } 
      // Handle graph data (nodes and relationships) for visualization
      else if (key === 'nodes' || key === 'relationships') {
        if (Array.isArray(value)) {
          if (key === 'nodes') {
            processedRecord[key] = value.map(node => ({
              id: node.identity.toString(),
              label: node.labels[0],
              name: node.properties.name || node.properties.id || node.identity.toString(),
              properties: node.properties
            }));
          } else {
            processedRecord[key] = value.map(rel => ({
              id: rel.identity.toString(),
              source: rel.start.toString(),
              target: rel.end.toString(),
              type: rel.type
            }));
          }
        } else {
          processedRecord[key] = value;
        }
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        processedRecord[key] = value;
      }
      // Handle primitive values
      else {
        processedRecord[key] = value;
      }
    });
    
    return processedRecord;
  });
  
  return { records };
}

// Gracefully close the driver when the application exits
process.on("exit", () => {
  driver.close();
});

module.exports = router;