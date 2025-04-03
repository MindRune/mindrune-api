"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessQuestCompletions = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * Process QUEST_COMPLETION events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessQuestCompletions = async (session, events, txnUuid, dataUuid, account, playerId) => {
    const params = {
        account,
        playerId,
        events: events.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            questName: event.details.questName || 'Unknown Quest',
            questPoints: event.details.questPoints,
            hasLocation: !!event.playerLocation,
            locationX: event.playerLocation?.x,
            locationY: event.playerLocation?.y,
            locationPlane: event.playerLocation?.plane
        }))
    };
    try {
        return await session.executeWrite(tx => {
            return tx.run(`
        MATCH (player:Player {account: $account, playerId: $playerId})
        
        UNWIND $events AS event
        
        // Check if a QuestCompletionEvent for this quest already exists
        OPTIONAL MATCH (existingEvent:QuestCompletionEvent {questName: event.questName})-[:PERFORMED_BY]->(player)
        
        // Only create a new event if one doesn't exist for this quest
        FOREACH (ignoreMe IN CASE WHEN existingEvent IS NULL THEN [1] ELSE [] END |
          // Create the event with quest name as a property
          CREATE (e:QuestCompletionEvent {
            uuid: event.event_uuid,
            eventType: 'QUEST_COMPLETION',
            timestamp: datetime(event.timestamp),
            questName: COALESCE(event.questName, 'Unknown Quest'),
            questPoints: event.questPoints
          })
          // Connect to player
          CREATE (e)-[:PERFORMED_BY]->(player)
          
          // Update player quest points if available
          FOREACH (ignoreMe2 IN CASE WHEN event.questPoints IS NOT NULL THEN [1] ELSE [] END |
            SET player.questPoints = event.questPoints
          )
          
          // Handle locations
          FOREACH (ignoreMe2 IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
            MERGE (location:Location {
              x: event.locationX,
              y: event.locationY,
              plane: event.locationPlane
            })
            CREATE (e)-[:LOCATED_AT]->(location)
          )
        )
      `, params);
        });
    }
    catch (error) {
        logger_1.default.error('Error processing quest completions:', error);
        throw error;
    }
};
exports.batchProcessQuestCompletions = batchProcessQuestCompletions;
exports.default = exports.batchProcessQuestCompletions;
//# sourceMappingURL=questCompletion.js.map