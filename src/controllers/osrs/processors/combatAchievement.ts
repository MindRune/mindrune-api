import { Neo4jSession } from '../../../types/neo4j.types';
import { GameEvent } from '../../../types/api.types';
import logger from '../../../utils/logger';

/**
 * Process COMBAT_ACHIEVEMENT_COMPLETION events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
export const batchProcessCombatAchievements = async (
  session: Neo4jSession,
  events: (GameEvent & { index: number })[],
  txnUuid: string,
  dataUuid: string,
  account: string,
  playerId: string
): Promise<void> => {
  const params = {
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${dataUuid}_${event.index}`,
      timestamp: event.timestamp,
      achievementName: event.details.achievementName || 'Unknown Achievement',
      tier: event.details.tier || 'Unknown',
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
        
        // Check if a CombatAchievementEvent for this achievement already exists
        OPTIONAL MATCH (existingEvent:CombatAchievementEvent {
          achievementName: event.achievementName
        })-[:PERFORMED_BY]->(player)
        
        // Only create a new event if one doesn't exist for this achievement
        FOREACH (ignoreMe IN CASE WHEN existingEvent IS NULL THEN [1] ELSE [] END |
          // Create the event with achievement properties
          CREATE (e:CombatAchievementEvent {
            uuid: event.event_uuid,
            eventType: 'COMBAT_ACHIEVEMENT_COMPLETION',
            timestamp: datetime(event.timestamp),
            achievementName: COALESCE(event.achievementName, 'Unknown Achievement'),
            tier: event.tier,
            message: event.message,
            // Extract boss name if available
            bossName: CASE 
              WHEN apoc.text.indexOf(event.achievementName, ' - ') > 0 
              THEN apoc.text.split(event.achievementName, ' - ')[0]
              ELSE null
            END
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
  } catch (error) {
    logger.error('Error processing combat achievements:', error);
    throw error;
  }
};

export default batchProcessCombatAchievements;