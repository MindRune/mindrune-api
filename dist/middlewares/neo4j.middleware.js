"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const neo4j_1 = __importDefault(require("../config/neo4j")); // Import your Neo4j connection config
const neo4jMiddleware = (req, res, next) => {
    try {
        req.neo4jSession = neo4j_1.default.getSession(); // Correctly get a session using your method
        res.on("finish", () => {
            req.neo4jSession?.close(); // Ensures session closes after response
        });
        next();
    }
    catch (error) {
        console.error("Failed to initialize Neo4j session:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
};
exports.default = neo4jMiddleware;
//# sourceMappingURL=neo4j.middleware.js.map