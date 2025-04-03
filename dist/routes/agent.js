"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_controller_1 = __importDefault(require("../controllers/agent.controller"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const neo4j_middleware_1 = __importDefault(require("../middlewares/neo4j.middleware"));
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.default.authenticateJwt, neo4j_middleware_1.default, // Injects Neo4j session
async (req, res) => {
    if (!req.neo4jSession) {
        return res.status(500).json({ success: false, msg: "Neo4j session unavailable" });
    }
    await agent_controller_1.default.processMessage(req, res, req.neo4jSession);
});
exports.default = router;
//# sourceMappingURL=agent.js.map