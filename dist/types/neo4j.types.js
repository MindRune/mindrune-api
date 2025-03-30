"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4jError = void 0;
/**
 * Neo4j error
 */
class Neo4jError extends Error {
    constructor(message, query, params) {
        super(message);
        this.query = query;
        this.params = params;
        this.name = 'Neo4jError';
    }
}
exports.Neo4jError = Neo4jError;
//# sourceMappingURL=neo4j.types.js.map