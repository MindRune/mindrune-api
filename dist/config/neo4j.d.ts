import { Driver, Session } from 'neo4j-driver';
import { Neo4jQueryResult, ProcessedNeo4jQueryResult } from '../types/neo4j.types';
/**
 * Initialize Neo4j driver
 * @returns Neo4j driver
 */
export declare const initDriver: () => Driver;
/**
 * Get Neo4j session
 * @returns Neo4j session
 */
export declare const getSession: () => Session;
/**
 * Execute Neo4j query
 * @param query - Cypher query
 * @param params - Query parameters
 * @returns Query result
 */
export declare const executeQuery: (query: string, params: string) => Promise<Neo4jQueryResult>;
/**
 * Process Neo4j query result into a frontend-friendly format
 * @param result - Neo4j query result
 * @returns Processed query result
 */
export declare const processQueryResult: (result: Neo4jQueryResult) => ProcessedNeo4jQueryResult;
/**
 * Close Neo4j driver
 */
export declare const closeDriver: () => Promise<void>;
declare const _default: {
    initDriver: () => Driver;
    getSession: () => Session;
    executeQuery: (query: string, params: string) => Promise<Neo4jQueryResult>;
    processQueryResult: (result: Neo4jQueryResult) => ProcessedNeo4jQueryResult;
    closeDriver: () => Promise<void>;
};
export default _default;
