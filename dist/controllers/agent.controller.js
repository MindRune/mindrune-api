"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
const uuid_1 = require("uuid");
// Get agent service URL from environment
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || "http://localhost:4000/agent";
/**
 * Controller that proxies requests to the external agent service
 */
class AgentController {
    constructor() {
        /**
         * Process a chat message by forwarding to agent service and inserting into Neo4j
         * @param req - Express request
         * @param res - Express response
         */
        this.processMessage = async (req, res, session) => {
            let promptUuid = null;
            let isAgentSuccess = false;
            try {
                const { message, playerId } = req.body;
                if (!message) {
                    res.status(400).json({
                        success: false,
                        msg: "Message is required",
                    });
                    return;
                }
                // Get user account from authenticated request
                // Since req.user is an array of UserTable objects from your auth middleware
                const userRecord = req.user && Array.isArray(req.user) ? req.user[0] : null;
                const account = userRecord?.account || req.body.account;
                if (!account) {
                    res.status(400).json({
                        success: false,
                        msg: "Account is required",
                    });
                    return;
                }
                logger_1.default.info(`Forwarding agent request to external service for account: ${account}, player: ${playerId}`, {
                    service: "mindrune-agent",
                });
                // Generate unique identifiers
                promptUuid = (0, uuid_1.v4)();
                const timestamp = new Date().toISOString();
                // First, insert account and prompt into Neo4j
                await session.executeWrite(async (tx) => {
                    // Merge account node or create if not exists
                    await tx.run(`
          MERGE (a:Account {account: $account})
ON CREATE SET
  a.createdAt = datetime($timestamp),
  a.firstSeen = datetime($timestamp)
ON MATCH SET
  a.lastSeen = datetime($timestamp)

// Create prompt event node with default success status
CREATE (p:Prompt {
  uuid: $promptUuid,
  eventType: 'PROMPT',
  timestamp: datetime($timestamp),
  userQuery: $message,
  cypherQuery: 'unknown',
  agentResponse: 'unknown',
  success: false
})

// Link prompt to account
CREATE (p)-[:ASKED_BY]->(a)

// Find and MERGE (not CREATE) relationships to players
// This ensures we only create the relationship if it doesn't exist
WITH a
MATCH (player:Player {account: $account})
MERGE (a)-[:HAS_PLAYER]->(player)
        `, {
                        account,
                        promptUuid,
                        timestamp,
                        message,
                    });
                });
                // Forward request to agent service
                const response = await axios_1.default.post(AGENT_SERVICE_URL, {
                    message,
                    account,
                    playerId,
                    playerName: req.body.playerName,
                    context: req.body.context || {},
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 480000, // 4 minute timeout
                });
                // Mark as successful
                isAgentSuccess = true;
                // Extract agent response and Cypher query
                let agentResponse = response.data.output || response.data;
                // Extract Cypher query from the response if available in intermediateSteps
                let cypherQuery = "unknown";
                if (response.data.intermediateSteps &&
                    Array.isArray(response.data.intermediateSteps)) {
                    // Look for Cypher queries in intermediate steps
                    for (const step of response.data.intermediateSteps) {
                        if (step.action &&
                            step.action.tool === "Neo4jGameDatabase" &&
                            step.action.toolInput) {
                            try {
                                const toolInput = JSON.parse(step.action.toolInput);
                                if (toolInput.query && typeof toolInput.query === "string") {
                                    cypherQuery = toolInput.query;
                                    // If there are multiple queries, take the last one
                                }
                            }
                            catch (e) {
                                logger_1.default.warn("Failed to parse tool input", { error: e });
                            }
                        }
                    }
                }
                // Update prompt success status in Neo4j
                await session.executeWrite(async (tx) => {
                    await tx.run(`
            MATCH (p:Prompt {uuid: $promptUuid})
            SET p.success = $success,
            p.agentResponse = $agentResponse,
            p.cypherQuery = $cypherQuery
            `, {
                        promptUuid,
                        success: true,
                        agentResponse: String(response.data.output || ""),
                        cypherQuery: String(cypherQuery || "unknown")
                    });
                });
                // Return the agent's response
                res.status(200).json(response.data);
            }
            catch (error) {
                logger_1.default.error("Error processing agent request", { error });
                // If prompt was created but agent failed, log the failure
                if (promptUuid) {
                    try {
                        await session.executeWrite(async (tx) => {
                            await tx.run(`
              MATCH (p:Prompt {uuid: $promptUuid})
              SET p.success = false,
                  p.errorMessage = $errorMessage
            `, {
                                promptUuid,
                                errorMessage: error instanceof Error ? error.message : "Unknown error",
                            });
                        });
                    }
                    catch (updateError) {
                        logger_1.default.error("Failed to update prompt error status", { updateError });
                    }
                }
                // Handle different types of errors
                if (axios_1.default.isAxiosError(error)) {
                    const axiosError = error;
                    if (axiosError.response) {
                        // The agent service returned an error response
                        res.status(axiosError.response.status || 500).json({
                            success: false,
                            msg: "Agent service error",
                            error: axiosError.response.data &&
                                typeof axiosError.response.data === "object"
                                ? axiosError.response.data.error
                                : axiosError.response.statusText,
                        });
                    }
                    else if (axiosError.request) {
                        // No response received from agent service
                        res.status(503).json({
                            success: false,
                            msg: "Agent service unavailable",
                            error: "Could not connect to agent service",
                        });
                    }
                    else {
                        // Something else went wrong with axios
                        res.status(500).json({
                            success: false,
                            msg: "Failed to process message",
                            error: process.env.NODE_ENV === "development"
                                ? axiosError.message
                                : undefined,
                        });
                    }
                }
                else {
                    // Non-Axios error
                    const err = error;
                    res.status(500).json({
                        success: false,
                        msg: "Failed to process message",
                        error: process.env.NODE_ENV === "development" ? err.message : undefined,
                    });
                }
            }
            finally {
                // Always close the Neo4j session
                await session.close();
            }
        };
        /**
         * Get health status of agent-related components
         * @param req - Express request
         * @param res - Express response
         */
        this.getHealth = async (req, res, session) => {
            try {
                // Verify Neo4j connectivity
                await session.executeRead((tx) => tx.run("RETURN 1 as test"));
                res.status(200).json({
                    status: "healthy",
                    service: "mindrune-agent",
                    neo4j: "connected",
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || "development",
                });
            }
            catch (error) {
                logger_1.default.error("Health check failed", { error });
                res.status(500).json({
                    status: "unhealthy",
                    error: process.env.NODE_ENV === "development"
                        ? error.message
                        : "Internal server error",
                });
            }
            finally {
                await session.close();
            }
        };
    }
}
exports.default = new AgentController();
//# sourceMappingURL=agent.controller.js.map