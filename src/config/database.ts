require('dotenv').config()
import * as mysql from 'mysql2/promise';
import { DbConfig, DbConnectionPool, DatabaseError } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Database connection pools
 */
const pools: Record<string, mysql.Pool> = {};

/**
 * Get database configuration from environment variables
 * @param database - Database name
 * @returns Database configuration
 */
const getDatabaseConfig = (database: string): DbConfig => {
  return {
    host: process.env.DBHOST || 'localhost',
    user: process.env.DBUSER || 'root',
    password: process.env.DBPASSWORD || '',
    database,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '100', 10),
    queueLimit: 0,
  };
};

/**
 * Get database connection pool
 * @param database - Database name
 * @returns Database connection pool
 */
export const getPool = (database: string): mysql.Pool => {
  if (!pools[database]) {
    logger.info(`Creating new connection pool for database '${database}'`);
    const config = getDatabaseConfig(database);
    pools[database] = mysql.createPool(config);
  }
  return pools[database];
};

/**
 * Execute database query
 * @param query - SQL query
 * @param params - Query parameters
 * @param database - Database name
 * @returns Query result
 */
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = [],
  database: string
): Promise<T> => {
  const pool = getPool(database);
  try {
    const [results] = await pool.query(query, params);
    return results as T;
  } catch (error) {
    logger.error(`Database error: ${(error as Error).message}`, {
      query,
      params,
      database,
    });
    throw new DatabaseError(
      `Database error: ${(error as Error).message}`,
      query,
      params
    );
  }
};

/**
 * Execute transaction with multiple queries
 * @param queries - Array of queries with their parameters
 * @param database - Database name
 * @returns Array of query results
 */
export const executeTransaction = async <T = any>(
  queries: { query: string; params: any[] }[],
  database: string
): Promise<T[]> => {
  const pool = getPool(database);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results: T[] = [];
    for (const { query, params } of queries) {
      const [result] = await connection.query(query, params);
      results.push(result as T);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    logger.error(`Transaction error: ${(error as Error).message}`, {
      queries,
      database,
    });
    throw new DatabaseError(`Transaction error: ${(error as Error).message}`);
  } finally {
    connection.release();
  }
};

/**
 * Close all database connection pools
 */
export const closeAllPools = async (): Promise<void> => {
  for (const [database, pool] of Object.entries(pools)) {
    logger.info(`Closing connection pool for database '${database}'`);
    await pool.end();
  }
};

export default {
  getPool,
  executeQuery,
  executeTransaction,
  closeAllPools,
};