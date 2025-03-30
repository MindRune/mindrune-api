"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = void 0;
/**
 * Database connection error
 */
class DatabaseError extends Error {
    constructor(message, query, params) {
        super(message);
        this.query = query;
        this.params = params;
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=database.types.js.map