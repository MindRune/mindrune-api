import { Neo4jSession } from '../../../types/neo4j.types';
import { GameEvent } from '../../../types/api.types';

/**
 * Process INVENTORY_CHANGE events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
export const batchProcessInventoryChanges = async (
  session: Neo4jSession,
  events: (GameEvent & { index: number })[],
  txnUuid: string,
  dataUuid: string,
  account: string,
  playerId: string
): Promise<void> => {
  // Add more verbose logging to debug the issue
  console.log(`Processing ${events.length} inventory changes.`);
  if (events.length > 0) {
    const sampleEvent = events[0];
    console.log("Sample event details:", {
      details: JSON.stringify(sampleEvent.details),
      itemName: sampleEvent.itemName,
      hasLocation: !!sampleEvent.playerLocation,
      eventKeys: Object.keys(sampleEvent)
    });
  }

  // Process the events to extract and clean data
  const processedEvents = events.map(event => {
    // Extract item name from either the event or its details
    let itemName = event.itemName || 'Unknown Item';
    let changeType = 'ADD'; // Default
    let oldPositions = '';
    let newPositions = '';
    
    // Extract from details if available
    if (event.details && typeof event.details === 'object') {
      // Extract item name
      if (event.details.itemName) {
        itemName = event.details.itemName;
      } else if (event.details.name) {
        itemName = event.details.name;
      } else if (event.details.item && event.details.item.name) {
        itemName = event.details.item.name;
      }
      
      // Check if this is a move operation
      if (event.details.changeType === 'MOVE') {
        changeType = 'MOVE';
        // Extract position information
        oldPositions = event.details.oldPositions || '';
        newPositions = event.details.newPositions || '';
      }
      
      // Clean up the item name
      if (itemName) {
        itemName = itemName.replace(/<\/col>$/, '').trim().replace(/\(level.*/, '');
      }
    }
    
    return {
      ...event,
      cleanItemName: itemName,
      changeType,
      oldPositions,
      newPositions
    };
  });

  // Log processed events for debugging
  if (processedEvents.length > 0) {
    console.log("Sample processed event:", {
      uuid: `${dataUuid}_${processedEvents[0].index}`,
      itemName: processedEvents[0].cleanItemName,
      changeType: processedEvents[0].changeType,
      oldPositions: processedEvents[0].oldPositions,
      newPositions: processedEvents[0].newPositions,
      hasLocation: !!processedEvents[0].playerLocation
    });
  }

  // Pre-process to ensure no null item names
  const params = {
    account,
    playerId,
    events: processedEvents.map(event => ({
      event_uuid: `${dataUuid}_${event.index}`,
      timestamp: event.timestamp,
      itemId: event.details.itemId,
      itemName: event.cleanItemName,
      changeType: event.changeType,
      oldPositions: event.oldPositions,
      newPositions: event.newPositions,
      quantity: event.details.quantity || 1,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return await session.executeWrite(async (tx) => {
    // Create ALL events first - no conditionals, just different property sets
    await tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
     
      UNWIND $events AS event
      
      // Create the base event node with properties based on change type
      CALL {
        WITH event
        WITH event WHERE event.changeType = 'ADD'
        CREATE (e:InventoryChange {
          uuid: event.event_uuid,
          eventType: 'INVENTORY_CHANGE',
          changeType: 'ADD',
          timestamp: datetime(event.timestamp),
          itemName: event.itemName,
          quantity: event.quantity
        })
        WITH e, event
        RETURN e, event.hasLocation as hasLocation, event.locationX as locationX, 
               event.locationY as locationY, event.locationPlane as locationPlane
        
        UNION
        
        WITH event
        WITH event WHERE event.changeType = 'MOVE'
        CREATE (e:InventoryChange {
          uuid: event.event_uuid,
          eventType: 'INVENTORY_CHANGE',
          changeType: 'MOVE',
          timestamp: datetime(event.timestamp),
          itemName: event.itemName,
          oldPositions: event.oldPositions,
          newPositions: event.newPositions
        })
        WITH e, event
        RETURN e, event.hasLocation as hasLocation, event.locationX as locationX, 
               event.locationY as locationY, event.locationPlane as locationPlane
      }
      
      // Connect the event to the player
      WITH e, player, hasLocation, locationX, locationY, locationPlane
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      // Create location relationship if applicable
      WITH e, hasLocation, locationX, locationY, locationPlane
      WHERE hasLocation = true
      MERGE (location:Location {
        x: locationX,
        y: locationY,
        plane: locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
    
    // Log success of event creation
    console.log("Created inventory change events with locations");
    
    // Process all items in a single query using MERGE for existence check
    await tx.run(`
      // Get all inventory events that need item processing
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:InventoryChange)-[:PERFORMED_BY]->(player)
      WHERE NOT EXISTS((e)-->(:Item))
      WITH e, e.itemName AS itemName, e.changeType AS changeType
      WHERE itemName IS NOT NULL AND itemName <> 'Unknown Item'
      
      // MERGE ensures we find or create exactly one item node
      MERGE (item:Item {name: itemName})
      
      // Set properties only on create
      ON CREATE SET item.color = "#FFD700" // Gold color for items
      
      // Create the appropriate relationship based on change type
      WITH e, item, changeType
      CALL {
        WITH e, item, changeType
        WITH e, item WHERE changeType = 'ADD'
        CREATE (e)-[:ADD]->(item)
        
        UNION
        
        WITH e, item, changeType
        WITH e, item WHERE changeType = 'MOVE'
        CREATE (e)-[:MOVE]->(item)
      }
    `, params);
    
    // Log status after item processing
    console.log("Linked events to items");
    
    // Double-check to make sure all events with locations are properly linked
    return tx.run(`
      // Find any events that should have locations but don't
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:InventoryChange)-[:PERFORMED_BY]->(player)
      
      // Get original event data by UUID
      WITH e, split(e.uuid, '_')[1] as eventIndex, $events as events
      WHERE toInteger(eventIndex) >= 0 AND toInteger(eventIndex) < size(events)
      WITH e, events[toInteger(eventIndex)] as originalEvent
      
      // Only process events that should have locations but don't
      WHERE originalEvent.hasLocation = true AND NOT EXISTS((e)-[:LOCATED_AT]->())
      
      // Create the missing location relationship
      MERGE (location:Location {
        x: originalEvent.locationX,
        y: originalEvent.locationY,
        plane: originalEvent.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
      
      RETURN count(e) as fixedLocationCount
    `, params)
    .then(result => {
      const fixedCount = result.records[0].get('fixedLocationCount').toNumber();
      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} missing location links`);
      }
    });
  });
};

export default batchProcessInventoryChanges;