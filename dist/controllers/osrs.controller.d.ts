import { Request, Response, NextFunction } from 'express';
/**
 * Create game data
 * @route POST /osrs/create
 */
export declare const createGameData: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Execute Neo4j query
 * @route POST /osrs/query
 */
export declare const executeNeo4jQuery: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    createGameData: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    executeNeo4jQuery: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
