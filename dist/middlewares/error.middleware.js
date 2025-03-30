"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.ApiError = void 0;
const database_types_1 = require("../types/database.types");
const neo4j_types_1 = require("../types/neo4j.types");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Custom API error class
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
/**
 * Middleware to handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Not found - ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Middleware to handle API errors
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let errorMessage = 'Internal Server Error';
    let errorDetails = undefined;
    // Log the error
    logger_1.default.error(`${err.name}: ${err.message}`, { stack: err.stack });
    // Handle specific error types
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        errorMessage = err.message;
    }
    else if (err instanceof database_types_1.DatabaseError) {
        errorMessage = 'Database Error';
        if (process.env.NODE_ENV === 'development') {
            errorDetails = {
                message: err.message,
                query: err.query,
                params: err.params,
            };
        }
    }
    else if (err instanceof neo4j_types_1.Neo4jError) {
        errorMessage = 'Graph Database Error';
        if (process.env.NODE_ENV === 'development') {
            errorDetails = {
                message: err.message,
                query: err.query,
                params: err.params,
            };
        }
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Validation Error';
        if (process.env.NODE_ENV === 'development') {
            errorDetails = err.message;
        }
    }
    else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorMessage = 'Authentication Error';
    }
    // Only provide error details in development environment
    const devError = process.env.NODE_ENV === 'development'
        ? errorDetails || err.stack
        : undefined;
    // Send the error response
    res.status(statusCode).json({
        success: false,
        msg: errorMessage,
        error: devError,
    });
};
exports.errorHandler = errorHandler;
exports.default = {
    ApiError,
    notFoundHandler: exports.notFoundHandler,
    errorHandler: exports.errorHandler,
};
//# sourceMappingURL=error.middleware.js.map