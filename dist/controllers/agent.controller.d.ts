import { Request, Response } from "express";
import { Neo4jSession } from "../types/neo4j.types";
/**
 * Controller that proxies requests to the external agent service
 */
declare class AgentController {
    /**
     * Process a chat message by forwarding to agent service and inserting into Neo4j
     * @param req - Express request
     * @param res - Express response
     */
    processMessage: (req: Request, res: Response, session: Neo4jSession) => Promise<void>;
    /**
     * Get health status of agent-related components
     * @param req - Express request
     * @param res - Express response
     */
    getHealth: (req: Request, res: Response, session: Neo4jSession) => Promise<void>;
}
declare const _default: AgentController;
export default _default;
