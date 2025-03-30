import { QueryResult, Record as Neo4jRecord } from 'neo4j-driver';
/**
 * Neo4j configuration
 */
export interface Neo4jConfig {
    uri: string;
    username: string;
    password: string;
}
/**
 * Neo4j query result node
 */
export interface Neo4jNodeRepresentation {
    id: string;
    labels: string[];
    properties: Record<string, any>;
}
/**
 * Neo4j query result relationship
 */
export interface Neo4jRelationshipRepresentation {
    id: string;
    type: string;
    startNodeId: string;
    endNodeId: string;
    properties: Record<string, any>;
}
/**
 * Neo4j query result path segment
 */
export interface Neo4jPathSegmentRepresentation {
    start: Neo4jNodeRepresentation;
    relationship: Neo4jRelationshipRepresentation;
    end: Neo4jNodeRepresentation;
}
/**
 * Neo4j query result path
 */
export interface Neo4jPathRepresentation {
    segments: Neo4jPathSegmentRepresentation[];
}
/**
 * Neo4j query result
 */
export type Neo4jQueryResult = QueryResult;
/**
 * Neo4j record type
 */
export type Neo4jRecordType = Neo4jRecord;
/**
 * Processed Neo4j record
 */
export interface ProcessedNeo4jRecord {
    [key: string]: any;
}
/**
 * Processed Neo4j query result
 */
export interface ProcessedNeo4jQueryResult {
    records: ProcessedNeo4jRecord[];
}
/**
 * Neo4j graph data format for visualization
 */
export interface Neo4jGraphData {
    nodes: {
        id: string;
        label: string;
        name: string;
        properties: Record<string, any>;
    }[];
    relationships: {
        id: string;
        source: string;
        target: string;
        type: string;
    }[];
}
/**
 * Player node
 */
export interface PlayerNode {
    account: string;
    playerId: string;
    name: string;
    combatLevel: number;
    lastUpdated: string;
}
/**
 * Event basic properties
 */
export interface GameEventNode {
    uuid: string;
    eventType: string;
    timestamp: string;
}
/**
 * Location node
 */
export interface LocationNode {
    x: number;
    y: number;
    plane: number;
}
/**
 * Neo4j transaction
 */
export interface Neo4jTransaction {
    run: (query: string, params?: Record<string, any>) => Promise<Neo4jQueryResult>;
}
/**
 * Neo4j session for transactions
 */
export interface Neo4jSession {
    run: (query: string, params?: string) => Promise<Neo4jQueryResult>;
    close: () => Promise<void>;
    executeWrite: (work: (tx: Neo4jTransaction) => Promise<any>) => Promise<any>;
    executeRead: (work: (tx: Neo4jTransaction) => Promise<any>) => Promise<any>;
}
/**
 * Neo4j driver
 */
export interface Neo4jDriver {
    session: () => Neo4jSession;
    close: () => Promise<void>;
}
/**
 * Neo4j error
 */
export declare class Neo4jError extends Error {
    query?: string | undefined;
    params?: string | undefined;
    constructor(message: string, query?: string | undefined, params?: string | undefined);
}
