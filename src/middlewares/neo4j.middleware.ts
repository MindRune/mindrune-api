import { Request, Response, NextFunction } from "express";
import neo4j from "../config/neo4j"; // Import your Neo4j connection config
import { Session } from "neo4j-driver"; // Import the correct Session type

declare module "express-serve-static-core" {
  interface Request {
    neo4jSession?: Session;
  }
}

const neo4jMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.neo4jSession = neo4j.getSession(); // Correctly get a session using your method

    res.on("finish", () => {
      req.neo4jSession?.close(); // Ensures session closes after response
    });

    next();
  } catch (error) {
    console.error("Failed to initialize Neo4j session:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
};

export default neo4jMiddleware;
