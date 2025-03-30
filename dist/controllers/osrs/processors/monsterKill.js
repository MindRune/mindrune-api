"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessMonsterKills = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * Process MONSTER_KILL events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessMonsterKills = async (session, events, txnUuid, dataUuid, account, playerId) => {
    logger_1.default.info(`Processing ${events.length} monster kills`);
    // Map all events to Neo4j format
    const processedEvents = events.map(event => {
        // Extract items array if present
        const items = event.details.items || [];
        return {
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            monsterName: event.details.monsterName || 'Unknown Monster',
            monsterId: event.details.monsterId,
            combatLevel: event.details.combatLevel,
            killId: event.details.killId,
            items: items,
            itemCount: items.length,
            hasLocation: !!event.playerLocation,
            locationX: event.playerLocation?.x,
            locationY: event.playerLocation?.y,
            locationPlane: event.playerLocation?.plane
        };
    });
    // Process events and their items
    const params = {
        account,
        playerId,
        events: processedEvents
    };
    return await session.executeWrite(tx => {
        return tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      // Create monster kill event node
      CREATE (e:MonsterKill {
        uuid: event.event_uuid,
        eventType: 'MONSTER_KILL',
        timestamp: datetime(event.timestamp),
        monsterName: event.monsterName,
        monsterId: event.monsterId,
        combatLevel: event.combatLevel,
        killId: event.killId,
        itemCount: event.itemCount
      })
      
      // Link from player to event (player killed monster)
      CREATE (player)-[:KILLED]->(e)
      
      // MERGE the monster character node - only create if it doesn't exist
      MERGE (monster:Character {name: event.monsterName})
      // Set properties only on first creation
      ON CREATE SET 
        monster.color = "#964B00", 
        monster.npcId = event.monsterId,
        monster.combatLevel = event.combatLevel
      
      // Link kill event to monster
      CREATE (e)-[:KILLED]->(monster)
      
      // Handle location
      FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
        MERGE (location:Location {
          x: event.locationX,
          y: event.locationY, 
          plane: event.locationPlane
        })
        CREATE (e)-[:LOCATED_AT]->(location)
      )
      
      // Process all items from this kill
      WITH e, monster, player, event
      
      UNWIND CASE WHEN size(event.items) > 0 THEN event.items ELSE [null] END AS item
      WITH e, monster, player, item WHERE item IS NOT NULL
      
      // MERGE the item node to avoid duplicates
      MERGE (itemNode:Item {name: item.itemName})
      ON CREATE SET 
        itemNode.color = "#FFD700",
        itemNode.itemId = item.itemId
      
      // Create the DROPPED relationship from kill to item with quantity
      CREATE (e)-[:DROPPED {quantity: item.quantity}]->(itemNode)
      
      // Also create a relationship from monster to item for general querying
      MERGE (monster)-[:DROPS]->(itemNode)
      
      // Find and link recent hitsplats from this player to this monster
      WITH e, monster, player
      MATCH (h:HitSplat)-[:PERFORMED_BY]->(player)
      WHERE h.timestamp > datetime() - duration({minutes: 2})
      MATCH (h)-[:TARGETED]->(target:Character)
      WHERE target.name = monster.name
      CREATE (h)-[:CONTRIBUTED_TO]->(e)
    `, params);
    });
};
exports.batchProcessMonsterKills = batchProcessMonsterKills;
exports.default = exports.batchProcessMonsterKills;
//# sourceMappingURL=monsterKill.js.map