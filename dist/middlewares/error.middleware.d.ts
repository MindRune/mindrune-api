import { Request, Response, NextFunction } from 'express';
/**
 * Custom API error class
 */
export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(statusCode: number, message: string, isOperational?: boolean);
}
/**
 * Middleware to handle 404 errors
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to handle API errors
 */
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    ApiError: typeof ApiError;
    notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
    errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
