import { Neo4jSession } from '../../../types/neo4j.types';
import { GameEvent } from '../../../types/api.types';
import logger from '../../../utils/logger';

/**
 * Process generic events that don't fit into standard categories
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
export const batchProcessGenericEvents = async (
  session: Neo4jSession,
  events: (GameEvent & { index: number })[],
  txnUuid: string,
  dataUuid: string,
  account: string,
  playerId: string
): Promise<void> => {
  // Log unknown event types for monitoring
  const eventTypes = [...new Set(events.map(e => e.eventType))];
  logger.info(`Processing unknown event types: ${eventTypes.join(', ')}`);
  
  const params = {
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${dataUuid}_${event.index}`,
      timestamp: event.timestamp,
      eventType: event.eventType,
      details: JSON.stringify(event.details || {}),
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
      
      CREATE (e:GameEvent {
        uuid: event.event_uuid,
        eventType: event.eventType,
        timestamp: datetime(event.timestamp),
        details: event.details
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
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

export default batchProcessGenericEvents;