"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCharacterId = exports.getOrCreateCharacter = exports.normalizeCharacterName = void 0;
exports.fixDuplicateCharacters = fixDuplicateCharacters;
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
    // Remove color tags, trim whitespace, and remove level info
    nameStr = nameStr.replace(/<\/?col(?:=.+?)?>/g, '')
        .replace(/<\/col>$/, '')
        .trim()
        .replace(/\(level.*/, '');
    // Additional cleanup for consistency
    nameStr = nameStr.replace(/\s+/g, ' '); // Normalize whitespace
    return nameStr || 'Unknown';
};
exports.normalizeCharacterName = normalizeCharacterName;
/**
 * Get or create a character node with the given name
 * This function should be used by both hitSplat.ts and menuClick.ts
 * to ensure consistent character node handling
 *
 * @param session Neo4j session
 * @param name Character name
 * @returns Promise resolving to the character node ID
 */
const getOrCreateCharacter = async (session, name) => {
    const normalizedName = (0, exports.normalizeCharacterName)(name);
    try {
        logger_1.default.debug(`[CharacterManager] Getting or creating character "${normalizedName}"`);
        // First check if character exists
        const existingResult = await session.executeRead(tx => tx.run(`
      MATCH (c:Character {name: $name})
      RETURN id(c) AS id
    `, { name: normalizedName }));
        if (existingResult.records.length > 0) {
            const id = existingResult.records[0].get('id');
            logger_1.default.debug(`[CharacterManager] Found existing character "${normalizedName}" with ID ${id}`);
            return id;
        }
        // If not exists, create it in a write transaction
        const createResult = await session.executeWrite(tx => tx.run(`
      CREATE (c:Character {name: $name, color: "#964B00"})
      RETURN id(c) AS id
    `, { name: normalizedName }));
        if (createResult.records.length > 0) {
            const id = createResult.records[0].get('id');
            logger_1.default.debug(`[CharacterManager] Created new character "${normalizedName}" with ID ${id}`);
            return id;
        }
        throw new Error(`Failed to get or create character node for "${normalizedName}"`);
    }
    catch (error) {
        logger_1.default.error(`[CharacterManager] Error in getOrCreateCharacter for "${normalizedName}": ${error}`);
        throw error;
    }
};
exports.getOrCreateCharacter = getOrCreateCharacter;
/**
 * Get the ID of an existing character, or undefined if not found
 * @param session Neo4j session
 * @param name Character name
 * @returns Promise resolving to the character node ID or undefined
 */
const getCharacterId = async (session, name) => {
    const normalizedName = (0, exports.normalizeCharacterName)(name);
    try {
        const result = await session.executeRead(tx => tx.run(`
      MATCH (c:Character {name: $name})
      RETURN id(c) AS id
    `, { name: normalizedName }));
        if (result.records.length > 0) {
            return result.records[0].get('id');
        }
        return undefined;
    }
    catch (error) {
        logger_1.default.error(`[CharacterManager] Error in getCharacterId for "${normalizedName}": ${error}`);
        return undefined;
    }
};
exports.getCharacterId = getCharacterId;
/**
 * Fix duplicate character nodes by merging them
 * This can be run after processing to clean up any duplicates
 * @param session Neo4j session
 */
async function fixDuplicateCharacters(session) {
    try {
        logger_1.default.info(`[CharacterManager] Starting to fix duplicate character nodes...`);
        // Find all duplicate character nodes by name (case-sensitive)
        const duplicatesResult = await session.executeRead(tx => tx.run(`
      MATCH (c:Character)
      WITH c.name AS name, collect(c) AS nodes
      WHERE size(nodes) > 1
      RETURN name, [n IN nodes | {id: id(n), name: n.name}] AS duplicates, 
             size(nodes) AS count
      ORDER BY count DESC
    `));
        logger_1.default.info(`[CharacterManager] Found ${duplicatesResult.records.length} sets of duplicate character nodes`);
        // For each set of duplicates
        for (const record of duplicatesResult.records) {
            const name = record.get('name');
            const duplicates = record.get('duplicates');
            const count = record.get('count');
            logger_1.default.info(`[CharacterManager] Processing "${name}" - found ${count} duplicates`);
            // Keep the first node and merge all others into it
            const primaryNodeId = duplicates[0].id;
            const duplicateNodeIds = duplicates.slice(1).map((d) => d.id);
            // First check what relationships the duplicates have
            const relInfo = await session.executeRead(tx => tx.run(`
        UNWIND $duplicateNodeIds AS dupId
        MATCH (duplicate:Character) WHERE id(duplicate) = dupId
        OPTIONAL MATCH (source)-[rel]->(duplicate)
        WITH duplicate, collect(DISTINCT {source: id(source), type: type(rel)}) AS incoming
        OPTIONAL MATCH (duplicate)-[rel]->(target)
        RETURN id(duplicate) AS nodeId, incoming, collect(DISTINCT {target: id(target), type: type(rel)}) AS outgoing
      `, { duplicateNodeIds }));
            logger_1.default.info(`[CharacterManager] Relationship info for duplicates of "${name}":`);
            relInfo.records.forEach((r) => {
                const nodeId = r.get('nodeId');
                const incoming = r.get('incoming');
                const outgoing = r.get('outgoing');
                logger_1.default.info(`  Node ${nodeId}: ${incoming.length} incoming, ${outgoing.length} outgoing relationships`);
            });
            // Merge the duplicates into the primary node
            await session.executeWrite(tx => tx.run(`
        // Get the primary node to keep
        MATCH (primary:Character) WHERE id(primary) = $primaryNodeId
        
        // For each duplicate node
        UNWIND $duplicateNodeIds AS dupId
        MATCH (duplicate:Character) WHERE id(duplicate) = dupId
        
        // First capture all incoming and outgoing relationships
        WITH primary, duplicate
        OPTIONAL MATCH (source)-[inRel]->(duplicate)
        WITH primary, duplicate, collect(distinct {source: source, type: type(inRel)}) AS incomingRels
        OPTIONAL MATCH (duplicate)-[outRel]->(target)
        WITH primary, duplicate, incomingRels, collect(distinct {target: target, type: type(outRel)}) AS outgoingRels
        
        // Process each incoming relationship
        FOREACH (rel IN incomingRels |
          FOREACH (ignoreMe IN CASE WHEN rel.source IS NOT NULL THEN [1] ELSE [] END |
            MERGE (rel.source)-[:` + rel.type + `]->(primary)
          )
        )
        
        // Process each outgoing relationship
        FOREACH (rel IN outgoingRels |
          FOREACH (ignoreMe IN CASE WHEN rel.target IS NOT NULL THEN [1] ELSE [] END |
            MERGE (primary)-[:` + rel.type + `]->(rel.target)
          )
        )
        
        // Finally delete the duplicate node
        DETACH DELETE duplicate
      `, { primaryNodeId, duplicateNodeIds }));
            logger_1.default.info(`[CharacterManager] Successfully merged ${duplicateNodeIds.length} duplicates for "${name}"`);
        }
        logger_1.default.info(`[CharacterManager] Successfully completed duplicate character cleanup`);
    }
    catch (error) {
        logger_1.default.error(`[CharacterManager] Error cleaning up duplicate characters: ${error}`);
        throw error;
    }
}
exports.default = {
    normalizeCharacterName: exports.normalizeCharacterName,
    getOrCreateCharacter: exports.getOrCreateCharacter,
    getCharacterId: exports.getCharacterId,
    fixDuplicateCharacters
};
//# sourceMappingURL=characterManager.js.map