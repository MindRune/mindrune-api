import * as mysql from 'mysql2/promise';
/**
 * Get database connection pool
 * @param database - Database name
 * @returns Database connection pool
 */
export declare const getPool: (database: string) => mysql.Pool;
/**
 * Execute database query
 * @param query - SQL query
 * @param params - Query parameters
 * @param database - Database name
 * @returns Query result
 */
export declare const executeQuery: <T = any>(query: string, params: any[] | undefined, database: string) => Promise<T>;
/**
 * Execute transaction with multiple queries
 * @param queries - Array of queries with their parameters
 * @param database - Database name
 * @returns Array of query results
 */
export declare const executeTransaction: <T = any>(queries: {
    query: string;
    params: any[];
}[], database: string) => Promise<T[]>;
/**
 * Close all database connection pools
 */
export declare const closeAllPools: () => Promise<void>;
declare const _default: {
    getPool: (database: string) => mysql.Pool;
    executeQuery: <T = any>(query: string, params: any[] | undefined, database: string) => Promise<T>;
    executeTransaction: <T = any>(queries: {
        query: string;
        params: any[];
    }[], database: string) => Promise<T[]>;
    closeAllPools: () => Promise<void>;
};
export default _default;
