"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessWorldChanges = void 0;
/**
 * Process WORLD_CHANGE events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessWorldChanges = async (session, events, txnUuid, dataUuid, account, playerId) => {
    const params = {
        account,
        playerId,
        events: events.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            worldId: event.details.worldId,
            previousWorldId: event.details.previousWorldId,
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
      
      CREATE (e:WorldChangeEvent {
        uuid: event.event_uuid,
        eventType: 'WORLD_CHANGE',
        timestamp: datetime(event.timestamp),
        worldId: event.worldId,
        previousWorldId: event.previousWorldId
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      // Create world nodes if world IDs are provided
      FOREACH (ignoreMe IN CASE WHEN event.worldId IS NOT NULL THEN [1] ELSE [] END |
        MERGE (world:World {worldId: event.worldId})
        CREATE (e)-[:CHANGED_TO]->(world)
      )
      
      FOREACH (ignoreMe IN CASE WHEN event.previousWorldId IS NOT NULL THEN [1] ELSE [] END |
        MERGE (previousWorld:World {worldId: event.previousWorldId})
        CREATE (e)-[:CHANGED_FROM]->(previousWorld)
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
exports.batchProcessWorldChanges = batchProcessWorldChanges;
exports.default = exports.batchProcessWorldChanges;
//# sourceMappingURL=worldChange.js.map