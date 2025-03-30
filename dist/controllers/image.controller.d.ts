import { Request, Response, NextFunction } from 'express';
/**
 * Get image by ID
 * @route GET /image/:imageId
 */
export declare const getImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get image metadata
 * @route GET /image/:imageId/metadata
 */
export declare const getImageMetadata: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * List available images
 * @route GET /image/list
 */
export declare const listImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    getImage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getImageMetadata: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
