"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDriver = exports.processQueryResult = exports.executeQuery = exports.getSession = exports.initDriver = void 0;
require('dotenv').config();
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const neo4j_types_1 = require("../types/neo4j.types");
const logger_1 = __importDefault(require("../utils/logger"));
let driver = null;
/**
 * Get Neo4j configuration from environment variables
 * @returns Neo4j configuration
 */
const getConfig = () => {
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
const initDriver = () => {
    if (!driver) {
        const config = getConfig();
        logger_1.default.info(`Initializing Neo4j driver for URI: ${config.uri}`);
        driver = neo4j_driver_1.default.driver(config.uri, neo4j_driver_1.default.auth.basic(config.username, config.password));
    }
    return driver;
};
exports.initDriver = initDriver;
/**
 * Get Neo4j session
 * @returns Neo4j session
 */
const getSession = () => {
    return (0, exports.initDriver)().session();
};
exports.getSession = getSession;
/**
 * Execute Neo4j query
 * @param query - Cypher query
 * @param params - Query parameters
 * @returns Query result
 */
const executeQuery = async (query, params) => {
    const session = (0, exports.getSession)();
    try {
        const result = await session.run(query, params);
        return result;
    }
    catch (error) {
        logger_1.default.error(`Neo4j error: ${error.message}`, {
            query,
            params,
        });
        throw new neo4j_types_1.Neo4jError(`Neo4j error: ${error.message}`, query, params);
    }
    finally {
        await session.close();
    }
};
exports.executeQuery = executeQuery;
/**
 * Process Neo4j query result into a frontend-friendly format
 * @param result - Neo4j query result
 * @returns Processed query result
 */
const processQueryResult = (result) => {
    if (!result.records || result.records.length === 0) {
        return { records: [] };
    }
    const keys = result.records[0].keys;
    const records = result.records.map((record) => {
        const processedRecord = {};
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
                    segments: value.segments.map((segment) => ({
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
                        processedRecord[keyStr] = value.map((node) => ({
                            id: node.identity.toString(),
                            label: node.labels[0],
                            name: node.properties.name || node.properties.id || node.identity.toString(),
                            properties: node.properties,
                        }));
                    }
                    else {
                        processedRecord[keyStr] = value.map((rel) => ({
                            id: rel.identity.toString(),
                            source: rel.start.toString(),
                            target: rel.end.toString(),
                            type: rel.type,
                        }));
                    }
                }
                else {
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
exports.processQueryResult = processQueryResult;
/**
 * Close Neo4j driver
 */
const closeDriver = async () => {
    if (driver) {
        logger_1.default.info('Closing Neo4j driver');
        await driver.close();
        driver = null;
    }
};
exports.closeDriver = closeDriver;
exports.default = {
    initDriver: exports.initDriver,
    getSession: exports.getSession,
    executeQuery: exports.executeQuery,
    processQueryResult: exports.processQueryResult,
    closeDriver: exports.closeDriver,
};
//# sourceMappingURL=neo4j.js.map