import { Request, Response, NextFunction } from 'express';
/**
 * Get user information
 * @route GET /user/info/:account?
 */
export declare const getUserInfo: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get user registration key
 * @route POST /user/registrationKey
 */
export declare const getRegistrationKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    getUserInfo: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRegistrationKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
