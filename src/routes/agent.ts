import { Router } from "express";
import agentController from "../controllers/agent.controller";
import authMiddleware from "../middlewares/auth.middleware";
import neo4jMiddleware from "../middlewares/neo4j.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware.authenticateJwt,
  neo4jMiddleware, // Injects Neo4j session
  async (req, res) => {
    if (!req.neo4jSession) {
      return res.status(500).json({ success: false, msg: "Neo4j session unavailable" });
    }
    await agentController.processMessage(req, res, req.neo4jSession);
  }
);

export default router;
