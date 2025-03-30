import { Neo4jSession } from "../types/neo4j.types";
/**
 * Normalize character names to ensure consistency
 * @param name The character name to normalize
 * @returns Normalized name
 */
export declare const normalizeCharacterName: (name: string | number | undefined) => string;
/**
 * Get or create a Character node, ensuring no duplicates
 * Uses atomic MERGE operation in Neo4j to prevent race conditions
 *
 * @param session Neo4j session
 * @param characterName The normalized character name
 * @returns Promise resolving to the character ID
 */
export declare const getOrCreateCharacter: (session: Neo4jSession, characterName: string) => Promise<number>;
/**
 * Get or create multiple Character nodes in a single transaction
 * @param session Neo4j session
 * @param characterNames Array of normalized character names
 * @returns Promise resolving to a map of name to ID
 */
export declare const getOrCreateMultipleCharacters: (session: Neo4jSession, characterNames: string[]) => Promise<Map<string, number>>;
/**
 * Find existing characters by name with case-insensitive matching
 * @param session Neo4j session
 * @param namePattern Pattern to search for
 * @param limit Maximum number of results to return
 * @returns Promise resolving to a list of character objects
 */
export declare const findCharactersByName: (session: Neo4jSession, namePattern: string, limit?: number) => Promise<Array<{
    id: number;
    name: string;
}>>;
/**
 * Find duplicate characters by similar names
 * @param session Neo4j session
 * @returns Promise resolving to a list of potential duplicate groups
 */
export declare const findDuplicateCharacters: (session: Neo4jSession) => Promise<Array<{
    baseName: string;
    duplicates: Array<{
        id: number;
        name: string;
    }>;
}>>;
export declare const mergeCharacterNodes: (session: Neo4jSession, primaryId: number, duplicateIds: number[]) => Promise<boolean>;
declare const _default: {
    normalizeCharacterName: (name: string | number | undefined) => string;
    getOrCreateCharacter: (session: Neo4jSession, characterName: string) => Promise<number>;
    getOrCreateMultipleCharacters: (session: Neo4jSession, characterNames: string[]) => Promise<Map<string, number>>;
    findCharactersByName: (session: Neo4jSession, namePattern: string, limit?: number) => Promise<Array<{
        id: number;
        name: string;
    }>>;
    findDuplicateCharacters: (session: Neo4jSession) => Promise<Array<{
        baseName: string;
        duplicates: Array<{
            id: number;
            name: string;
        }>;
    }>>;
    mergeCharacterNodes: (session: Neo4jSession, primaryId: number, duplicateIds: number[]) => Promise<boolean>;
};
export default _default;
