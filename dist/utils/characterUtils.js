"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeCharacterNodes = exports.findDuplicateCharacters = exports.findCharactersByName = exports.getOrCreateMultipleCharacters = exports.getOrCreateCharacter = exports.normalizeCharacterName = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Normalize character names to ensure consistency
 * @param name The character name to normalize
 * @returns Normalized name
 */
const normalizeCharacterName = (name) => {
    if (name === undefined || name === null)
        return 'Unknown';
    // Convert to string if it's a number
    let nameStr = String(name);
    let originalStr = nameStr; // Store original for comparison
    // Remove color tags, trim whitespace, and remove level info
    nameStr = nameStr.replace(/<\/?col(?:=.+?)?>/g, '')
        .replace(/<\/col>$/, '')
        .trim() // This trims leading and trailing whitespace
        .replace(/\(level.*/, '');
    // Additional cleanup for consistency
    nameStr = nameStr.replace(/\s+/g, ' '); // Normalize multiple spaces to single space
    // Ensure trimming happens again at the end to catch any trailing spaces
    // that might have been left after removing level info
    nameStr = nameStr.trim();
    // Add logging to help debug whitespace issues - using the string versions
    if (nameStr !== originalStr) {
        logger_1.default.debug(`[CharacterUtils] Normalized character name from "${originalStr}" (${originalStr.length} chars) to "${nameStr}" (${nameStr.length} chars)`);
    }
    return nameStr || 'Unknown';
};
exports.normalizeCharacterName = normalizeCharacterName;
/**
 * Get or create a Character node, ensuring no duplicates
 * Uses atomic MERGE operation in Neo4j to prevent race conditions
 *
 * @param session Neo4j session
 * @param characterName The normalized character name
 * @returns Promise resolving to the character ID
 */
const getOrCreateCharacter = async (session, characterName) => {
    try {
        // Use MERGE to atomically find or create the character
        const result = await session.executeWrite(tx => tx.run(`
      MERGE (c:Character {name: $name})
      ON CREATE SET c.color = "#964B00", c.createdAt = datetime()
      RETURN id(c) AS id
    `, { name: characterName }));
        if (result.records.length > 0) {
            const characterId = result.records[0].get('id').toNumber();
            logger_1.default.debug(`[CharacterUtils] Character "${characterName}" found or created with ID ${characterId}`);
            return characterId;
        }
        else {
            throw new Error(`Failed to create or find character "${characterName}"`);
        }
    }
    catch (error) {
        logger_1.default.error(`[CharacterUtils] Error in getOrCreateCharacter for "${characterName}": ${error}`);
        throw error;
    }
};
exports.getOrCreateCharacter = getOrCreateCharacter;
/**
 * Get or create multiple Character nodes in a single transaction
 * @param session Neo4j session
 * @param characterNames Array of normalized character names
 * @returns Promise resolving to a map of name to ID
 */
const getOrCreateMultipleCharacters = async (session, characterNames) => {
    // Remove duplicates from the input array and filter out empty/Unknown names
    const uniqueNames = [...new Set(characterNames)].filter(name => name && name !== 'Unknown');
    if (uniqueNames.length === 0) {
        return new Map();
    }
    try {
        logger_1.default.debug(`[CharacterUtils] Processing ${uniqueNames.length} unique character names`);
        const result = await session.executeWrite(tx => tx.run(`
      UNWIND $names AS name
      MERGE (c:Character {name: name})
      ON CREATE SET c.color = "#964B00", c.createdAt = datetime()
      RETURN c.name AS name, id(c) AS id
    `, { names: uniqueNames }));
        const characterMap = new Map();
        // Properly type the Neo4j records
        result.records.forEach((record) => {
            const name = record.get('name');
            const id = record.get('id').toNumber(); // Using 'any' for the integer type
            characterMap.set(name, id);
        });
        logger_1.default.debug(`[CharacterUtils] Successfully processed ${characterMap.size} characters`);
        return characterMap;
    }
    catch (error) {
        logger_1.default.error(`[CharacterUtils] Error in getOrCreateMultipleCharacters: ${error}`);
        throw error;
    }
};
exports.getOrCreateMultipleCharacters = getOrCreateMultipleCharacters;
/**
 * Find existing characters by name with case-insensitive matching
 * @param session Neo4j session
 * @param namePattern Pattern to search for
 * @param limit Maximum number of results to return
 * @returns Promise resolving to a list of character objects
 */
const findCharactersByName = async (session, namePattern, limit = 10) => {
    try {
        // Escape special regex characters in the name pattern
        const escapedPattern = namePattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const result = await session.executeRead(tx => tx.run(`
      MATCH (c:Character)
      WHERE c.name =~ '(?i).*${escapedPattern}.*'
      RETURN id(c) AS id, c.name AS name
      ORDER BY c.name
      LIMIT $limit
    `, { limit }));
        return result.records.map((record) => ({
            id: record.get('id').toNumber(),
            name: record.get('name')
        }));
    }
    catch (error) {
        logger_1.default.error(`[CharacterUtils] Error in findCharactersByName: ${error}`);
        return [];
    }
};
exports.findCharactersByName = findCharactersByName;
/**
 * Find duplicate characters by similar names
 * @param session Neo4j session
 * @returns Promise resolving to a list of potential duplicate groups
 */
const findDuplicateCharacters = async (session) => {
    try {
        const result = await session.executeRead(tx => tx.run(`
      MATCH (c:Character)
      WITH toLower(trim(c.name)) AS lowName, collect(c) AS nodes
      WHERE size(nodes) > 1
      RETURN lowName, [n IN nodes | {id: id(n), name: n.name}] AS duplicates
    `));
        return result.records.map((record) => ({
            baseName: record.get('lowName'),
            duplicates: record.get('duplicates')
        }));
    }
    catch (error) {
        logger_1.default.error(`[CharacterUtils] Error in findDuplicateCharacters: ${error}`);
        return [];
    }
};
exports.findDuplicateCharacters = findDuplicateCharacters;
const mergeCharacterNodes = async (session, primaryId, duplicateIds) => {
    if (duplicateIds.length === 0) {
        return true; // Nothing to merge
    }
    try {
        // First, get the primary node name
        const primaryResult = await session.executeRead(tx => tx.run(`
     MATCH (c:Character) WHERE id(c) = $id
     RETURN c.name AS name
   `, { id: primaryId }));
        if (primaryResult.records.length === 0) {
            throw new Error(`Primary character with ID ${primaryId} not found`);
        }
        const primaryName = primaryResult.records[0].get('name');
        logger_1.default.info(`[CharacterUtils] Merging duplicates into primary character "${primaryName}" (ID: ${primaryId})`);
        // For each duplicate:
        // 1. Find and collect all relationships
        // 2. Re-create those relationships with the primary node
        // 3. Delete the duplicate
        for (const duplicateId of duplicateIds) {
            if (duplicateId === primaryId)
                continue; // Skip if same as primary
            // Get duplicate info
            const duplicateResult = await session.executeRead(tx => tx.run(`
       MATCH (c:Character) WHERE id(c) = $id
       RETURN c.name AS name
     `, { id: duplicateId }));
            if (duplicateResult.records.length === 0) {
                logger_1.default.warn(`[CharacterUtils] Duplicate character with ID ${duplicateId} not found, skipping`);
                continue;
            }
            const duplicateName = duplicateResult.records[0].get('name');
            logger_1.default.info(`[CharacterUtils] Processing duplicate "${duplicateName}" (ID: ${duplicateId})`);
            // Get all incoming relationships
            const incomingResult = await session.executeRead(tx => tx.run(`
       MATCH (source)-[r]->(dup:Character)
       WHERE id(dup) = $duplicateId AND NOT (source:Character AND id(source) = $primaryId)
       RETURN DISTINCT type(r) AS relType, count(r) AS count
     `, { duplicateId, primaryId }));
            // For each relationship type, copy relationships to primary
            for (const record of incomingResult.records) {
                const relType = record.get('relType');
                const count = record.get('count').toNumber();
                logger_1.default.info(`[CharacterUtils] Copying ${count} incoming ${relType} relationships`);
                // Using apoc.refactor.from/to is the most reliable way, if available
                try {
                    await session.executeWrite(tx => tx.run(`
           MATCH (source)-[r:${relType}]->(dup:Character)
           WHERE id(dup) = $duplicateId AND NOT (source:Character AND id(source) = $primaryId)
           WITH source, r
           MATCH (primary:Character) WHERE id(primary) = $primaryId
           MERGE (source)-[:${relType}]->(primary)
         `, { duplicateId, primaryId }));
                }
                catch (err) {
                    logger_1.default.error(`[CharacterUtils] Error copying incoming ${relType} relationships: ${err}`);
                }
            }
            // Get all outgoing relationships
            const outgoingResult = await session.executeRead(tx => tx.run(`
       MATCH (dup:Character)-[r]->(target)
       WHERE id(dup) = $duplicateId AND NOT (target:Character AND id(target) = $primaryId)
       RETURN DISTINCT type(r) AS relType, count(r) AS count
     `, { duplicateId, primaryId }));
            // For each relationship type, copy relationships to primary
            for (const record of outgoingResult.records) {
                const relType = record.get('relType');
                const count = record.get('count').toNumber();
                logger_1.default.info(`[CharacterUtils] Copying ${count} outgoing ${relType} relationships`);
                try {
                    await session.executeWrite(tx => tx.run(`
           MATCH (dup:Character)-[r:${relType}]->(target)
           WHERE id(dup) = $duplicateId AND NOT (target:Character AND id(target) = $primaryId)
           WITH target, r
           MATCH (primary:Character) WHERE id(primary) = $primaryId
           MERGE (primary)-[:${relType}]->(target)
         `, { duplicateId, primaryId }));
                }
                catch (err) {
                    logger_1.default.error(`[CharacterUtils] Error copying outgoing ${relType} relationships: ${err}`);
                }
            }
            // Finally delete the duplicate
            try {
                await session.executeWrite(tx => tx.run(`
         MATCH (dup:Character) WHERE id(dup) = $duplicateId
         DETACH DELETE dup
       `, { duplicateId }));
                logger_1.default.info(`[CharacterUtils] Successfully deleted duplicate "${duplicateName}" (ID: ${duplicateId})`);
            }
            catch (err) {
                logger_1.default.error(`[CharacterUtils] Error deleting duplicate: ${err}`);
            }
        }
        return true;
    }
    catch (error) {
        logger_1.default.error(`[CharacterUtils] Error in mergeCharacterNodes: ${error}`);
        return false;
    }
};
exports.mergeCharacterNodes = mergeCharacterNodes;
exports.default = {
    normalizeCharacterName: exports.normalizeCharacterName,
    getOrCreateCharacter: exports.getOrCreateCharacter,
    getOrCreateMultipleCharacters: exports.getOrCreateMultipleCharacters,
    findCharactersByName: exports.findCharactersByName,
    findDuplicateCharacters: exports.findDuplicateCharacters,
    mergeCharacterNodes: exports.mergeCharacterNodes
};
//# sourceMappingURL=characterUtils.js.map