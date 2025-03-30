/**
 * Check if a string is valid JSON
 * @param str - String to check
 * @returns Whether the string is valid JSON
 */
export declare const isJsonString: (str: string) => boolean;
/**
 * Validate that Neo4j query contains account parameter for security
 * @param query - Query to validate
 * @returns Whether the query is secure
 */
export declare const isSecureQuery: (query: string) => boolean;
/**
 * Validate coordinates are within expected ranges for OSRS map
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param plane - Plane (0-3)
 * @returns Whether the coordinates are valid
 */
export declare const validateCoordinates: (x: number | undefined, y: number | undefined, plane: number | undefined) => boolean;
declare const _default: {
    isJsonString: (str: string) => boolean;
    isSecureQuery: (query: string) => boolean;
    validateCoordinates: (x: number | undefined, y: number | undefined, plane: number | undefined) => boolean;
};
export default _default;
