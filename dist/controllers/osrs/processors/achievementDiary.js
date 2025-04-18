"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessAchievementDiaries = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
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
    try {
        return await session.executeWrite(tx => {
            return tx.run(`
        MATCH (player:Player {account: $account, playerId: $playerId})
        
        UNWIND $events AS event
        
        // Check if an AchievementDiaryEvent for this diary and tier already exists
        OPTIONAL MATCH (existingEvent:AchievementDiaryEvent {
          diaryName: event.diaryName, 
          diaryTier: event.diaryTier
        })-[:PERFORMED_BY]->(player)
        
        // Only create a new event if one doesn't exist for this diary and tier
        FOREACH (ignoreMe IN CASE WHEN existingEvent IS NULL THEN [1] ELSE [] END |
          // Create the event with diary properties
          CREATE (e:AchievementDiaryEvent {
            uuid: event.event_uuid,
            eventType: 'ACHIEVEMENT_DIARY_COMPLETION',
            timestamp: datetime(event.timestamp),
            diaryName: COALESCE(event.diaryName, 'Unknown Diary'),
            diaryTier: event.diaryTier,
            message: event.message
          })
          // Connect to player
          CREATE (e)-[:PERFORMED_BY]->(player)
          
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
        logger_1.default.error('Error processing achievement diaries:', error);
        throw error;
    }
};
exports.batchProcessAchievementDiaries = batchProcessAchievementDiaries;
exports.default = exports.batchProcessAchievementDiaries;
//# sourceMappingURL=achievementDiary.js.map