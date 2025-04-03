import { Request, Response, NextFunction } from "express";
import { Session } from "neo4j-driver";
declare module "express-serve-static-core" {
    interface Request {
        neo4jSession?: Session;
    }
}
declare const neo4jMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export default neo4jMiddleware;
