import { Request, Response, NextFunction } from 'express';
/**
 * Get Auth0 login URL
 * @route GET /auth/login
 */
export declare const getLoginUrl: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Handle Auth0 callback
 * @route POST /auth/callback
 */
export declare const handleCallback: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Refresh token
 * @route POST /auth/refresh
 */
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get registration key
 * @route GET /auth/registration-key
 */
export declare const getRegistrationKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const authController: {
    getLoginUrl: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    handleCallback: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRegistrationKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default authController;
