import { Request, Response, NextFunction } from 'express';
/**
 * Initialize passport with JWT strategy
 */
export declare const initializePassport: () => void;
/**
 * Middleware to authenticate JWT token
 */
export declare const authenticateJwt: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user is registered
 */
export declare const requireRegistered: (req: Request, res: Response, next: NextFunction) => void;
declare const authMiddleware: {
    initializePassport: () => void;
    authenticateJwt: (req: Request, res: Response, next: NextFunction) => void;
    requireRegistered: (req: Request, res: Response, next: NextFunction) => void;
};
export default authMiddleware;
