import { Neo4jSession } from '../../../types/neo4j.types';
import { GameEvent } from '../../../types/api.types';
import logger from '../../../utils/logger';

/**
 * Process HIT_SPLAT events with separate transactions for incoming and outgoing events
 */
export const batchProcessHitSplats = async (
  session: Neo4jSession,
  events: (GameEvent & { index: number })[],
  txnUuid: string,
  dataUuid: string,
  account: string,
  playerId: string
): Promise<void> => {
  // Log a sample event for debugging
  if (events.length > 0) {
    const sampleEvent = events[0];
    logger.info(`Sample HIT_SPLAT event: ${JSON.stringify({
      details: sampleEvent.details,
      direction: sampleEvent.details.direction,
      source: sampleEvent.details.source,
      typeString: sampleEvent.details.typeString
    })}`);
  }

  // Separate events by direction
  const incomingEvents = events.filter(e => e.details.direction === 'incoming');
  const outgoingEvents = events.filter(e => e.details.direction === 'outgoing');
  const unknownEvents = events.filter(e => e.details.direction !== 'incoming' && e.details.direction !== 'outgoing');
  
  logger.info(`Processing ${events.length} HIT_SPLAT events: ${incomingEvents.length} incoming, ${outgoingEvents.length} outgoing, ${unknownEvents.length} unknown`);

  // List of ONLY the specific affliction types that should be Affliction nodes
  const afflictionTypes = [
    "POISON", "DISEASE", "VENOM", "BURN", 
    "POISON_ENEMY", "DISEASE_ENEMY", "VENOM_ENEMY", 
    "VENOM_ME", "POISON_ME", "DISEASE_ME"
  ];

  // List of ALL damage types that should NEVER be monster nodes
  const allDamageTypes = [
    // Specific afflictions (these will become Affliction nodes)
    "POISON", "DISEASE", "VENOM", "BURN", 
    "POISON_ENEMY", "DISEASE_ENEMY", "VENOM_ENEMY", 
    "VENOM_ME", "POISON_ME", "DISEASE_ME",
    // Other damage types (these won't create any nodes)
    "DAMAGE", "HEAL", "BLOCK", "MAX_DAMAGE", "NORMAL", "MISSED",
    "DAMAGE_ME", "DAMAGE_OTHER", "BLOCK_ME", "HEAL_ME", "HEAL_OTHER",
    "TYPE", "SPLASH", "HIT", "HITSPLAT", "CRITICAL", "MAXHIT"
  ];

  // Process incoming events
  if (incomingEvents.length > 0) {
    const incomingParams = {
      account,
      playerId,
      events: incomingEvents.map(event => {
        // Use typeString if available, otherwise check if source is a number and convert
        let source = event.details.source;
        let typeString = event.details.typeString;
        
        // If we don't have typeString but source is numeric, it might be a hitsplat type ID
        if (!typeString && typeof source === 'number') {
          typeString = `DAMAGE_TYPE_${source}`;
        }
        
        // Clean up source if it's a string (remove color tags and level info)
        if (typeof source === 'string') {
          source = source.replace(/<\/?col[^>]*>/g, '').replace(/\(level.*/, '').trim();
        } else if (typeof source === 'number' || !source) {
          source = typeString || `DAMAGE_TYPE_${source || 'UNKNOWN'}`;
        }
        
        // First check if this is a damage type at all (to prevent monster nodes)
        let isDamageType = false;
        
        if (typeof source === 'string') {
          const upperSource = source.toUpperCase();
          isDamageType = allDamageTypes.some(type => upperSource.includes(type)) ||
                         upperSource.startsWith('DAMAGE_TYPE_') ||
                         /^\d+$/.test(source);
        } else if (typeof source === 'number') {
          isDamageType = true;
        }
        
        if (typeString) {
          const upperTypeString = typeString.toUpperCase();
          if (allDamageTypes.some(type => upperTypeString.includes(type))) {
            isDamageType = true;
          }
        }
        
        // Now check if it's specifically an affliction (should create Affliction node)
        let isAffliction = false;
        
        if (isDamageType) {
          // Only count as an affliction if it matches the specific affliction types
          const upperSource = String(source).toUpperCase();
          isAffliction = afflictionTypes.some(type => upperSource.includes(type));
          
          if (typeString) {
            const upperTypeString = typeString.toUpperCase();
            if (afflictionTypes.some(type => upperTypeString.includes(type))) {
              isAffliction = true;
              source = typeString; // Use typeString for consistency
            }
          }
        }
        
        // Check if this is a max hit
        const isMaxHit = (typeString && typeString.toUpperCase().includes("MAX_DAMAGE")) || 
                         (source && String(source).toUpperCase().includes("MAX_DAMAGE")) || 
                         false;
        
        return {
          event_uuid: `${dataUuid}_${event.index}`,
          timestamp: event.timestamp,
          damage: event.details.damage || 0,
          type: event.details.type,
          typeString: typeString || 'UNKNOWN',
          source: source || 'Unknown',
          isAffliction,
          isDamageType,
          isMaxHit,
          hasLocation: !!event.playerLocation,
          locationX: event.playerLocation?.x,
          locationY: event.playerLocation?.y,
          locationPlane: event.playerLocation?.plane
        };
      })
    };
    
    // Log sample processed event
    if (incomingParams.events.length > 0) {
      logger.info(`Sample processed incoming event: ${JSON.stringify(incomingParams.events[0])}`);
    }
    
    await session.executeWrite(tx => tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      // Create the combat event first
      CREATE (e:HitSplat {
        uuid: event.event_uuid,
        eventType: 'HIT_SPLAT',
        timestamp: datetime(event.timestamp),
        damage: event.damage,
        direction: 'incoming',
        damageType: event.typeString,
        isMaxHit: event.isMaxHit
      })
      
      // Link event to its location if available
      FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
        MERGE (location:Location {
          x: event.locationX, y: event.locationY, plane: event.locationPlane
        })
        CREATE (e)-[:LOCATED_AT]->(location)
      )
      
      // Link the event to the player as target
      CREATE (e)-[:TARGETED]->(player)
      
      // Handle different source types using a conditional approach
      WITH e, event, player
      
      // For regular monsters
      FOREACH (ignoreMe IN CASE WHEN NOT event.isDamageType THEN [1] ELSE [] END |
        MERGE (monster:Monster {name: event.source})
        ON CREATE SET monster.color = "#964B00"
        CREATE (monster)-[:PERFORMED]->(e)
      )
      
      // For afflictions only
      FOREACH (ignoreMe IN CASE WHEN event.isAffliction THEN [1] ELSE [] END |
        MERGE (affliction:Affliction {name: event.source})
        ON CREATE SET affliction.color = "#800080"
        CREATE (affliction)-[:CAUSED]->(e)
      )
      
      // For damage types that aren't afflictions, we don't create any node
      // The HitSplat just stands alone
    `, incomingParams));
  }

  // Process outgoing events - similar logic for target filtering
  if (outgoingEvents.length > 0) {
    const outgoingParams = {
      account,
      playerId,
      events: outgoingEvents.map(event => {
        // Get typeString
        let typeString = event.details.typeString || `DAMAGE_TYPE_${event.details.type || 'UNKNOWN'}`;
        
        // Clean up target if it's a string (remove color tags and level info)
        let target = event.details.target ? 
          (typeof event.details.target === 'string' ? 
            event.details.target.replace(/<\/?col[^>]*>/g, '').trim().replace(/\(level.*/, '') : 
            String(event.details.target)
          ) : 'Unknown';
        
        // Check if target is a damage type (should be skipped)
        let isTargetDamageType = false;
        if (typeof target === 'string') {
          const upperTarget = target.toUpperCase();
          isTargetDamageType = allDamageTypes.some(type => upperTarget.includes(type)) ||
                              upperTarget.startsWith('DAMAGE_TYPE_') ||
                              /^\d+$/.test(target);
        }
        
        // Check if this is a max hit
        const isMaxHit = typeString.toUpperCase().includes("MAX_DAMAGE") || false;
        
        return {
          event_uuid: `${dataUuid}_${event.index}`,
          timestamp: event.timestamp,
          damage: event.details.damage || 0,
          type: event.details.type,
          typeString,
          target,
          isTargetDamageType,
          isMaxHit,
          hasLocation: !!event.playerLocation,
          locationX: event.playerLocation?.x,
          locationY: event.playerLocation?.y,
          locationPlane: event.playerLocation?.plane
        };
      }).filter(event => !event.isTargetDamageType) // Filter out damage type targets
    };
    
    // Only proceed if we have valid events after filtering
    if (outgoingParams.events.length > 0) {
      await session.executeWrite(tx => tx.run(`
        MATCH (player:Player {account: $account, playerId: $playerId})
        
        UNWIND $events AS event
        
        // Create the combat event
        CREATE (e:HitSplat {
          uuid: event.event_uuid,
          eventType: 'HIT_SPLAT',
          timestamp: datetime(event.timestamp),
          damage: event.damage,
          direction: 'outgoing',
          damageType: event.typeString,
          isMaxHit: event.isMaxHit
        })
        
        // Link event to its location if available
        FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
          MERGE (location:Location {
            x: event.locationX, y: event.locationY, plane: event.locationPlane
          })
          CREATE (e)-[:LOCATED_AT]->(location)
        )
        
        // Player performed the hit
        CREATE (player)-[:PERFORMED]->(e)
        
        // Merge target monster and link
        MERGE (monster:Monster {name: COALESCE(event.target, 'Unknown')})
        ON CREATE SET monster.color = "#964B00"
        CREATE (e)-[:TARGETED]->(monster)
      `, outgoingParams));
    }
  }

  // Process unknown direction events - similar filtering
  if (unknownEvents.length > 0) {
    const unknownParams = {
      account,
      playerId,
      events: unknownEvents.map(event => {
        // Get typeString
        let typeString = event.details.typeString || `DAMAGE_TYPE_${event.details.type || 'UNKNOWN'}`;
        
        // Clean up target if it's a string (remove color tags and level info)
        let target = event.details.target ? 
          (typeof event.details.target === 'string' ? 
            event.details.target.replace(/<\/?col[^>]*>/g, '').trim().replace(/\(level.*/, '') : 
            String(event.details.target)
          ) : 'Unknown';
        
        // Check if target is a damage type (should be skipped)
        let isTargetDamageType = false;
        if (typeof target === 'string') {
          const upperTarget = target.toUpperCase();
          isTargetDamageType = allDamageTypes.some(type => upperTarget.includes(type)) ||
                              upperTarget.startsWith('DAMAGE_TYPE_') ||
                              /^\d+$/.test(target);
        }
        
        // Check if this is a max hit
        const isMaxHit = typeString.toUpperCase().includes("MAX_DAMAGE") || false;
        
        return {
          event_uuid: `${dataUuid}_${event.index}`,
          timestamp: event.timestamp,
          damage: event.details.damage || 0,
          type: event.details.type,
          typeString,
          target,
          isTargetDamageType,
          isMaxHit,
          hasLocation: !!event.playerLocation,
          locationX: event.playerLocation?.x,
          locationY: event.playerLocation?.y,
          locationPlane: event.playerLocation?.plane
        };
      }).filter(event => 
        event.target && event.target !== '' && event.target !== 'Player' && !event.isTargetDamageType
      ) // Filter invalid targets
    };
    
    // Only proceed if we have valid events after filtering
    if (unknownParams.events.length > 0) {
      await session.executeWrite(tx => tx.run(`
        MATCH (player:Player {account: $account, playerId: $playerId})
        
        UNWIND $events AS event
        
        // Create the combat event
        CREATE (e:HitSplat {
          uuid: event.event_uuid,
          eventType: 'HIT_SPLAT',
          timestamp: datetime(event.timestamp),
          damage: event.damage,
          damageType: event.typeString,
          isMaxHit: event.isMaxHit
        })
        
        // Link event to its location if available
        FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
          MERGE (location:Location {
            x: event.locationX, y: event.locationY, plane: event.locationPlane
          })
          CREATE (e)-[:LOCATED_AT]->(location)
        )
        
        // Player performed the hit
        CREATE (player)-[:PERFORMED]->(e)
        
        // Merge target monster and link
        MERGE (monster:monster {name: COALESCE(event.target, 'Unknown')})
        ON CREATE SET monster.color = "#964B00"
        CREATE (e)-[:TARGETED]->(monster)
      `, unknownParams));
    }
  }
};

export default batchProcessHitSplats;