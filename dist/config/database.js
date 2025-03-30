"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAllPools = exports.executeTransaction = exports.executeQuery = exports.getPool = void 0;
require('dotenv').config();
const mysql = __importStar(require("mysql2/promise"));
const database_types_1 = require("../types/database.types");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Database connection pools
 */
const pools = {};
/**
 * Get database configuration from environment variables
 * @param database - Database name
 * @returns Database configuration
 */
const getDatabaseConfig = (database) => {
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
const getPool = (database) => {
    if (!pools[database]) {
        logger_1.default.info(`Creating new connection pool for database '${database}'`);
        const config = getDatabaseConfig(database);
        pools[database] = mysql.createPool(config);
    }
    return pools[database];
};
exports.getPool = getPool;
/**
 * Execute database query
 * @param query - SQL query
 * @param params - Query parameters
 * @param database - Database name
 * @returns Query result
 */
const executeQuery = async (query, params = [], database) => {
    const pool = (0, exports.getPool)(database);
    try {
        const [results] = await pool.query(query, params);
        return results;
    }
    catch (error) {
        logger_1.default.error(`Database error: ${error.message}`, {
            query,
            params,
            database,
        });
        throw new database_types_1.DatabaseError(`Database error: ${error.message}`, query, params);
    }
};
exports.executeQuery = executeQuery;
/**
 * Execute transaction with multiple queries
 * @param queries - Array of queries with their parameters
 * @param database - Database name
 * @returns Array of query results
 */
const executeTransaction = async (queries, database) => {
    const pool = (0, exports.getPool)(database);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.query(query, params);
            results.push(result);
        }
        await connection.commit();
        return results;
    }
    catch (error) {
        await connection.rollback();
        logger_1.default.error(`Transaction error: ${error.message}`, {
            queries,
            database,
        });
        throw new database_types_1.DatabaseError(`Transaction error: ${error.message}`);
    }
    finally {
        connection.release();
    }
};
exports.executeTransaction = executeTransaction;
/**
 * Close all database connection pools
 */
const closeAllPools = async () => {
    for (const [database, pool] of Object.entries(pools)) {
        logger_1.default.info(`Closing connection pool for database '${database}'`);
        await pool.end();
    }
};
exports.closeAllPools = closeAllPools;
exports.default = {
    getPool: exports.getPool,
    executeQuery: exports.executeQuery,
    executeTransaction: exports.executeTransaction,
    closeAllPools: exports.closeAllPools,
};
//# sourceMappingURL=database.js.map