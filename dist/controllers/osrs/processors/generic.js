"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessGenericEvents = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * Process generic events that don't fit into standard categories
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessGenericEvents = async (session, events, txnUuid, dataUuid, account, playerId) => {
    // Log unknown event types for monitoring
    const eventTypes = [...new Set(events.map(e => e.eventType))];
    logger_1.default.info(`Processing unknown event types: ${eventTypes.join(', ')}`);
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
exports.batchProcessGenericEvents = batchProcessGenericEvents;
exports.default = exports.batchProcessGenericEvents;
//# sourceMappingURL=generic.js.map