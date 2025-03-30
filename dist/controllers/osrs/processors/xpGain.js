"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessXpGains = void 0;
/**
 * Process XP_GAIN events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessXpGains = async (session, events, txnUuid, dataUuid, account, playerId) => {
    const params = {
        account,
        playerId,
        events: events.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            skill: event.details.skill || 'Unknown',
            xpGained: event.details.xpGained,
            totalXp: event.details.totalXp,
            level: event.details.level,
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
      
      CREATE (e:XpGain {
        uuid: event.event_uuid,
        eventType: 'XP_GAIN',
        timestamp: datetime(event.timestamp),
        skill: event.skill,
        xpGained: event.xpGained,
        totalXp: event.totalXp,
        level: event.level
      })
      CREATE (e)-[:GAINED_BY]->(player)
      
      MERGE (skill:Skill {name: COALESCE(event.skill, 'Unknown')})
      CREATE (e)-[:RELATED_TO]->(skill)
      
      // Only create location relationships for events that have location data
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
exports.batchProcessXpGains = batchProcessXpGains;
exports.default = exports.batchProcessXpGains;
//# sourceMappingURL=xpGain.js.map