"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessAchievementDiaries = void 0;
/**
 * Process ACHIEVEMENT_DIARY_COMPLETION events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessAchievementDiaries = async (session, events, txnUuid, dataUuid, account, playerId) => {
    const params = {
        account,
        playerId,
        events: events.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            diaryName: event.details.diaryName || 'Unknown Diary',
            diaryTier: event.details.diaryTier,
            message: event.details.message || '',
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
      
      CREATE (e:AchievementDiaryEvent {
        uuid: event.event_uuid,
        eventType: 'ACHIEVEMENT_DIARY_COMPLETION',
        timestamp: datetime(event.timestamp),
        diaryName: COALESCE(event.diaryName, 'Unknown Diary'),
        diaryTier: event.diaryTier,
        message: event.message
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      MERGE (diary:AchievementDiary {name: COALESCE(event.diaryName, 'Unknown Diary')})
      SET diary.tier = event.diaryTier
      CREATE (e)-[:COMPLETED]->(diary)
      
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
exports.batchProcessAchievementDiaries = batchProcessAchievementDiaries;
exports.default = exports.batchProcessAchievementDiaries;
//# sourceMappingURL=achievementDiary.js.map