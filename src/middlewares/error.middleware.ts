import { Request, Response, NextFunction } from 'express';
import { DatabaseError } from '../types/database.types';
import { Neo4jError } from '../types/neo4j.types';
import logger from '../utils/logger';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public isOperational = true) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware to handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Middleware to handle API errors
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errorDetails: any = undefined;
  
  // Log the error
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
  
  // Handle specific error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof DatabaseError) {
    errorMessage = 'Database Error';
    if (process.env.NODE_ENV === 'development') {
      errorDetails = {
        message: err.message,
        query: err.query,
        params: err.params,
      };
    }
  } else if (err instanceof Neo4jError) {
    errorMessage = 'Graph Database Error';
    if (process.env.NODE_ENV === 'development') {
      errorDetails = {
        message: err.message,
        query: err.query,
        params: err.params,
      };
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation Error';
    if (process.env.NODE_ENV === 'development') {
      errorDetails = err.message;
    }
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
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

export default {
  ApiError,
  notFoundHandler,
  errorHandler,
};