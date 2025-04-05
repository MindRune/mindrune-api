import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { Neo4jSession } from "../types/neo4j.types";
import logger from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

// Get agent service URL from environment
const AGENT_SERVICE_URL =
  process.env.AGENT_SERVICE_URL || "http://localhost:4000/agent";

// Interface for the user object from auth middleware
interface UserTable {
  account: string;
  registered: number;
  // add other properties your user object might have
}

/**
 * Controller that proxies requests to the external agent service
 */
class AgentController {
  /**
   * Process a chat message by forwarding to agent service and inserting into Neo4j
   * @param req - Express request
   * @param res - Express response
   */
  public processMessage = async (
    req: Request,
    res: Response,
    session: Neo4jSession
  ): Promise<void> => {
    let promptUuid: string | null = null;
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
      const userRecord =
        req.user && Array.isArray(req.user) ? (req.user[0] as UserTable) : null;
      const account = userRecord?.account || req.body.account;

      if (!account) {
        res.status(400).json({
          success: false,
          msg: "Account is required",
        });
        return;
      }

      logger.info(
        `Forwarding agent request to external service for account: ${account}, player: ${playerId}`,
        {
          service: "mindrune-agent",
        }
      );

      // Forward request to agent service
      const response = await axios.post(
        AGENT_SERVICE_URL,
        {
          message,
          account,
          playerId,
          playerName: req.body.playerName,
          context: req.body.context || {},
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 480000, // 4 minute timeout
        }
      );

      // Mark as successful
      isAgentSuccess = true;

      // Extract Cypher query from the response if available in intermediateSteps
      let cypherQuery = "unknown";
      if (
        response.data.intermediateSteps &&
        Array.isArray(response.data.intermediateSteps)
      ) {
        // Look for Cypher queries in intermediate steps
        for (const step of response.data.intermediateSteps) {
          if (
            step.action &&
            step.action.tool === "Neo4jGameDatabase" &&
            step.action.toolInput
          ) {
            try {
              const toolInput = JSON.parse(step.action.toolInput);
              if (toolInput.query && typeof toolInput.query === "string") {
                cypherQuery = toolInput.query;
                // If there are multiple queries, take the last one
              }
            } catch (e) {
              logger.warn("Failed to parse tool input", { error: e });
            }
          }
        }
      }

      // Return the agent's response
      res.status(200).json(response.data);
    } catch (error: unknown) {
      logger.error("Error processing agent request", { error });

      // If prompt was created but agent failed, log the failure
      if (promptUuid) {
        try {
          await session.executeWrite(async (tx) => {
            await tx.run(
              `
              MATCH (p:Prompt {uuid: $promptUuid})
              SET p.success = false,
                  p.errorMessage = $errorMessage
            `,
              {
                promptUuid,
                errorMessage:
                  error instanceof Error ? error.message : "Unknown error",
              }
            );
          });
        } catch (updateError) {
          logger.error("Failed to update prompt error status", { updateError });
        }
      }

      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          // The agent service returned an error response
          res.status(axiosError.response.status || 500).json({
            success: false,
            msg: "Agent service error",
            error:
              axiosError.response.data &&
              typeof axiosError.response.data === "object"
                ? (axiosError.response.data as any).error
                : axiosError.response.statusText,
          });
        } else if (axiosError.request) {
          // No response received from agent service
          res.status(503).json({
            success: false,
            msg: "Agent service unavailable",
            error: "Could not connect to agent service",
          });
        } else {
          // Something else went wrong with axios
          res.status(500).json({
            success: false,
            msg: "Failed to process message",
            error:
              process.env.NODE_ENV === "development"
                ? axiosError.message
                : undefined,
          });
        }
      } else {
        // Non-Axios error
        const err = error as Error;
        res.status(500).json({
          success: false,
          msg: "Failed to process message",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    } finally {
      // Always close the Neo4j session
      await session.close();
    }
  };

  /**
   * Get health status of agent-related components
   * @param req - Express request
   * @param res - Express response
   */
  public getHealth = async (
    req: Request,
    res: Response,
    session: Neo4jSession
  ): Promise<void> => {
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
    } catch (error) {
      logger.error("Health check failed", { error });
      res.status(500).json({
        status: "unhealthy",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Internal server error",
      });
    } finally {
      await session.close();
    }
  };
}

export default new AgentController();
