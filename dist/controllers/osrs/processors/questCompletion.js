"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessQuestCompletions = void 0;
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
    return await session.executeWrite(tx => {
        return tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:QuestCompletionEvent {
        uuid: event.event_uuid,
        eventType: 'QUEST_COMPLETION',
        timestamp: datetime(event.timestamp),
        questName: COALESCE(event.questName, 'Unknown Quest'),
        questPoints: event.questPoints
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      MERGE (quest:Quest {name: COALESCE(event.questName, 'Unknown Quest')})
      SET quest.questPoints = event.questPoints
      CREATE (e)-[:COMPLETED]->(quest)
      
      // Update player quest points if available
      FOREACH (ignoreMe IN CASE WHEN event.questPoints IS NOT NULL THEN [1] ELSE [] END |
        SET player.questPoints = event.questPoints
      )
      
      // Handle locations
      FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
        MERGE (location:Location {
          x: event.locationX,
          y: event.locationY, 
          plane: event.locationPlane
        })
        CREATE (e)-[:LOCATED_AT]->(location)
      )
    `, params);
    });
};
exports.batchProcessQuestCompletions = batchProcessQuestCompletions;
exports.default = exports.batchProcessQuestCompletions;
//# sourceMappingURL=questCompletion.js.map