"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoordinates = exports.isSecureQuery = exports.isJsonString = void 0;
/**
 * Check if a string is valid JSON
 * @param str - String to check
 * @returns Whether the string is valid JSON
 */
const isJsonString = (str) => {
    try {
        JSON.parse(str);
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.isJsonString = isJsonString;
/**
 * Validate that Neo4j query contains account parameter for security
 * @param query - Query to validate
 * @returns Whether the query is secure
 */
const isSecureQuery = (query) => {
    return query.includes('$account');
};
exports.isSecureQuery = isSecureQuery;
/**
 * Validate coordinates are within expected ranges for OSRS map
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param plane - Plane (0-3)
 * @returns Whether the coordinates are valid
 */
const validateCoordinates = (x, y, plane) => {
    // OSRS map is typically within these bounds
    // Adjust as needed based on actual game data
    if (x === undefined || y === undefined) {
        return false;
    }
    const validX = x >= 1000 && x <= 4000;
    const validY = y >= 1000 && y <= 4000;
    const validPlane = plane === undefined || (plane >= 0 && plane <= 3);
    return validX && validY && validPlane;
};
exports.validateCoordinates = validateCoordinates;
exports.default = {
    isJsonString: exports.isJsonString,
    isSecureQuery: exports.isSecureQuery,
    validateCoordinates: exports.validateCoordinates
};
//# sourceMappingURL=validation.js.map