require('dotenv').config()
import neo4j, { Driver, Session, QueryResult, Record } from 'neo4j-driver';
import {
  Neo4jConfig,
  Neo4jQueryResult,
  ProcessedNeo4jQueryResult,
  ProcessedNeo4jRecord,
  Neo4jError,
  Neo4jRecordType
} from '../types/neo4j.types';
import logger from '../utils/logger';

let driver: Driver | null = null;

/**
 * Get Neo4j configuration from environment variables
 * @returns Neo4j configuration
 */
const getConfig = (): Neo4jConfig => {
  return {
    uri: process.env.NEO4J_URI || 'neo4j://localhost:7687',
    username: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'neo4j',
  };
};

/**
 * Initialize Neo4j driver
 * @returns Neo4j driver
 */
export const initDriver = (): Driver => {
  if (!driver) {
    const config = getConfig();
    logger.info(`Initializing Neo4j driver for URI: ${config.uri}`);
    driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password)
    );
  }
  return driver;
};

/**
 * Get Neo4j session
 * @returns Neo4j session
 */
export const getSession = (): Session => {
  return initDriver().session();
};

/**
 * Execute Neo4j query
 * @param query - Cypher query
 * @param params - Query parameters
 * @returns Query result
 */
export const executeQuery = async (
  query: string,
  params: string,
): Promise<Neo4jQueryResult> => {
  const session = getSession();
  try {
    const result = await session.run(query, params);
    return result;
  } catch (error) {
    logger.error(`Neo4j error: ${(error as Error).message}`, {
      query,
      params,
    });
    throw new Neo4jError(
      `Neo4j error: ${(error as Error).message}`,
      query,
      params
    );
  } finally {
    await session.close();
  }
};

/**
 * Process Neo4j query result into a frontend-friendly format
 * @param result - Neo4j query result
 * @returns Processed query result
 */
export const processQueryResult = (
  result: Neo4jQueryResult
): ProcessedNeo4jQueryResult => {
  if (!result.records || result.records.length === 0) {
    return { records: [] };
  }

  const keys = result.records[0].keys;
  const records: ProcessedNeo4jRecord[] = result.records.map((record: Neo4jRecordType) => {
    const processedRecord: ProcessedNeo4jRecord = {};

    keys.forEach((key) => {
      // Convert key to string to ensure type compatibility
      const keyStr = String(key);
      const value = record.get(keyStr);

      if (value === null || value === undefined) {
        processedRecord[keyStr] = null;
      }
      // Handle Neo4j Nodes
      else if (value.labels && value.properties) {
        processedRecord[keyStr] = {
          id: value.identity.toString(),
          labels: value.labels,
          ...value.properties,
        };
      }
      // Handle Neo4j Relationships
      else if (value.type && value.start && value.end) {
        processedRecord[keyStr] = {
          id: value.identity.toString(),
          type: value.type,
          startNodeId: value.start.toString(),
          endNodeId: value.end.toString(),
          ...value.properties,
        };
      }
      // Handle Neo4j Paths
      else if (value.segments) {
        processedRecord[keyStr] = {
          segments: value.segments.map((segment: any) => ({
            start: {
              id: segment.start.identity.toString(),
              labels: segment.start.labels,
              ...segment.start.properties,
            },
            relationship: {
              id: segment.relationship.identity.toString(),
              type: segment.relationship.type,
              ...segment.relationship.properties,
            },
            end: {
              id: segment.end.identity.toString(),
              labels: segment.end.labels,
              ...segment.end.properties,
            },
          })),
        };
      }
      // Handle graph data (nodes and relationships) for visualization
      else if (keyStr === 'nodes' || keyStr === 'relationships') {
        if (Array.isArray(value)) {
          if (keyStr === 'nodes') {
            processedRecord[keyStr] = value.map((node: any) => ({
              id: node.identity.toString(),
              label: node.labels[0],
              name: node.properties.name || node.properties.id || node.identity.toString(),
              properties: node.properties,
            }));
          } else {
            processedRecord[keyStr] = value.map((rel: any) => ({
              id: rel.identity.toString(),
              source: rel.start.toString(),
              target: rel.end.toString(),
              type: rel.type,
            }));
          }
        } else {
          processedRecord[keyStr] = value;
        }
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        processedRecord[keyStr] = value;
      }
      // Handle primitive values
      else {
        processedRecord[keyStr] = value;
      }
    });

    return processedRecord;
  });

  return { records };
};

/**
 * Close Neo4j driver
 */
export const closeDriver = async (): Promise<void> => {
  if (driver) {
    logger.info('Closing Neo4j driver');
    await driver.close();
    driver = null;
  }
};

export default {
  initDriver,
  getSession,
  executeQuery,
  processQueryResult,
  closeDriver,
};