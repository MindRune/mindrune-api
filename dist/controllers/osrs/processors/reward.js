"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessRewards = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * Process REWARD events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessRewards = async (session, events, txnUuid, dataUuid, account, playerId) => {
    // Get only reward events
    const rewardEvents = events.filter(e => e.eventType === 'REWARD');
    logger_1.default.info(`Processing ${rewardEvents.length} rewards`);
    if (rewardEvents.length === 0) {
        return; // No rewards to process
    }
    // Create the reward nodes with the reward source as a property
    const rewardParams = {
        account,
        playerId,
        events: rewardEvents.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            rewardSource: event.details.rewardSource || 'Unknown Source',
            completionCount: event.details.completionCount,
            message: event.details.message,
            rewardId: event.details.rewardId,
            hasLocation: !!event.playerLocation,
            locationX: event.playerLocation?.x,
            locationY: event.playerLocation?.y,
            locationPlane: event.playerLocation?.plane
        }))
    };
    await session.executeWrite(tx => {
        return tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      // Create reward event node with rewardSource as a property
      CREATE (reward:Reward {
        uuid: event.event_uuid,
        eventType: 'REWARD',
        timestamp: datetime(event.timestamp),
        completionCount: event.completionCount,
        message: event.message,
        rewardId: event.rewardId,
        rewardSource: event.rewardSource,
        color: "#8E44AD"  // Updated reward color
      })
      
      // Link to player
      CREATE (reward)-[:RECEIVED_BY]->(player)
      
      // Handle location
      FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
        MERGE (location:Location {
          x: event.locationX,
          y: event.locationY, 
          plane: event.locationPlane
        })
        CREATE (reward)-[:LOCATED_AT]->(location)
      )
    `, rewardParams);
    });
    // Now process items and link them directly to rewards
    const itemsParams = {
        account,
        playerId,
        events: rewardEvents.flatMap(event => {
            // Extract individual items from the items array
            const items = event.details.items || [];
            return items.map((item) => ({
                rewardId: event.details.rewardId,
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity
            }));
        })
    };
    // Only process if there are items to process
    if (itemsParams.events.length > 0) {
        logger_1.default.info(`Processing ${itemsParams.events.length} items from rewards`);
        await session.executeWrite(tx => {
            return tx.run(`
        UNWIND $events AS event
        
        // Use WITH to separate the UNWIND from the MATCH
        WITH event
        
        // Find the associated reward event by rewardId
        MATCH (reward:Reward {rewardId: event.rewardId})
        
        // MERGE the item node to avoid duplicates
        MERGE (item:Item {name: event.itemName})
        ON CREATE SET 
          item.color = "#F1C40F",  // Updated item color
          item.itemId = event.itemId
        
        // Create the relationship between reward and item with quantity
        CREATE (reward)-[:CONTAINS {quantity: event.quantity}]->(item)
      `, itemsParams);
        });
    }
};
exports.batchProcessRewards = batchProcessRewards;
exports.default = exports.batchProcessRewards;
//# sourceMappingURL=reward.js.map