import { Neo4jSession } from '../types/neo4j.types';
/**
 * Normalize character names to ensure consistency
 * @param name The character name to normalize
 * @returns Normalized name
 */
export declare const normalizeCharacterName: (name: string | number | undefined) => string;
/**
 * Get or create a character node with the given name
 * This function should be used by both hitSplat.ts and menuClick.ts
 * to ensure consistent character node handling
 *
 * @param session Neo4j session
 * @param name Character name
 * @returns Promise resolving to the character node ID
 */
export declare const getOrCreateCharacter: (session: Neo4jSession, name: string) => Promise<number>;
/**
 * Get the ID of an existing character, or undefined if not found
 * @param session Neo4j session
 * @param name Character name
 * @returns Promise resolving to the character node ID or undefined
 */
export declare const getCharacterId: (session: Neo4jSession, name: string) => Promise<number | undefined>;
/**
 * Fix duplicate character nodes by merging them
 * This can be run after processing to clean up any duplicates
 * @param session Neo4j session
 */
export declare function fixDuplicateCharacters(session: Neo4jSession): Promise<void>;
declare const _default: {
    normalizeCharacterName: (name: string | number | undefined) => string;
    getOrCreateCharacter: (session: Neo4jSession, name: string) => Promise<number>;
    getCharacterId: (session: Neo4jSession, name: string) => Promise<number | undefined>;
    fixDuplicateCharacters: typeof fixDuplicateCharacters;
};
export default _default;
