"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessCombatAchievements = void 0;
/**
 * Process COMBAT_ACHIEVEMENT_COMPLETION events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessCombatAchievements = async (session, events, txnUuid, dataUuid, account, playerId) => {
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
    return await session.executeWrite(tx => {
        return tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:CombatAchievementEvent {
        uuid: event.event_uuid,
        eventType: 'COMBAT_ACHIEVEMENT_COMPLETION',
        timestamp: datetime(event.timestamp),
        achievementName: COALESCE(event.achievementName, 'Unknown Achievement'),
        tier: event.tier,
        message: event.message
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      MERGE (achievement:CombatAchievement {name: COALESCE(event.achievementName, 'Unknown Achievement')})
      SET achievement.tier = event.tier
      CREATE (e)-[:COMPLETED]->(achievement)
      
      // If we have a boss name in the achievement, create that relationship
      FOREACH (ignoreMe IN CASE WHEN apoc.text.indexOf(event.achievementName, ' - ') > 0 THEN [1] ELSE [] END |
        LET bossName = apoc.text.split(event.achievementName, ' - ')[0]
        MERGE (boss:Boss {name: bossName})
        CREATE (achievement)-[:RELATES_TO]->(boss)
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
exports.batchProcessCombatAchievements = batchProcessCombatAchievements;
exports.default = exports.batchProcessCombatAchievements;
//# sourceMappingURL=combatAchievement.js.map