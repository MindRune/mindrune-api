"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeNeo4jQuery = exports.createGameData = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const neo4j_1 = __importDefault(require("../config/neo4j"));
const spam_protection_1 = __importDefault(require("../utils/spam-protection"));
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middlewares/error.middleware");
/**
 * Clean target text by removing level information and color tags
 * Ensures the result is never null or empty
 * @param targetText - Target text to clean
 * @returns Cleaned text or default value if result would be empty
 */
const cleanTargetText = (targetText) => {
    if (!targetText || targetText.trim() === '') {
        return 'Unknown'; // Return a default value instead of empty string
    }
    let cleanedText = targetText;
    // Remove level information
    let levelIndex = cleanedText.indexOf('(level');
    if (levelIndex !== -1) {
        cleanedText = cleanedText.substring(0, levelIndex).trim();
    }
    // Remove level information with hyphen
    levelIndex = cleanedText.indexOf('(level-');
    if (levelIndex !== -1) {
        cleanedText = cleanedText.substring(0, levelIndex).trim();
    }
    // Remove color tags
    cleanedText = cleanedText.replace(/<col=[^>]*>/g, '').replace(/<\/col>/g, '');
    // Remove other common RuneScape formatting
    cleanedText = cleanedText.replace(/<\/?[^>]+(>|$)/g, '');
    // Return 'Unknown' if the result is empty after all cleaning
    return cleanedText.trim() || 'Unknown';
};
/**
 * Check if a string is valid JSON
 * @param str - String to check
 * @returns Whether the string is valid JSON
 */
const isJsonString = (str) => {
    try {
        JSON.parse(str);
        return true;
    }
    catch (e) {
        return false;
    }
};
/**
 * Insert game data into Neo4j
 * @param data - Game data
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @returns Operation result
 */
const insertIntoNeo4j = async (data, txnUuid, dataUuid, account) => {
    const neo4jStartTime = Date.now();
    logger_1.default.info(`Starting insertIntoNeo4j for account: ${account}`);
    const session = neo4j_1.default.getSession();
    try {
        // Extract player info and events
        const playerInfo = data[0];
        const events = data.slice(1);
        logger_1.default.info(`Processing ${events.length} events`);
        // Create/Update Player node only (no Transaction node)
        const nodesCreationStartTime = Date.now();
        logger_1.default.info(`Creating/updating player node`);
        await session.executeWrite((tx) => {
            return tx.run(`
        MERGE (player:Player {account: $account, playerId: $playerId})
        SET player.name = $playerName,
            player.combatLevel = $combatLevel,
            player.lastUpdated = datetime()
        RETURN player
        `, {
                account,
                playerId: playerInfo.playerId,
                playerName: playerInfo.playerName || 'Unknown Player',
                combatLevel: playerInfo.combatLevel
            });
        });
        logger_1.default.info(`Player node updated in ${Date.now() - nodesCreationStartTime}ms`);
        // Group events by type for batch processing
        const eventsByType = {};
        events.forEach((event, index) => {
            if (!eventsByType[event.eventType]) {
                eventsByType[event.eventType] = [];
            }
            eventsByType[event.eventType].push({ ...event, index });
        });
        logger_1.default.info(`Grouped events into ${Object.keys(eventsByType).length} types`);
        // Process each event type in batches
        const eventsProcessingStartTime = Date.now();
        for (const eventType in eventsByType) {
            const typeStartTime = Date.now();
            const eventsOfType = eventsByType[eventType];
            logger_1.default.info(`Processing batch of ${eventsOfType.length} ${eventType} events`);
            switch (eventType) {
                case 'MENU_CLICK':
                    await batchProcessMenuClicks(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'XP_GAIN':
                    await batchProcessXpGains(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'INVENTORY_CHANGE':
                    await batchProcessInventoryChanges(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'HIT_SPLAT':
                    await batchProcessHitSplats(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'WORLD_CHANGE':
                    await batchProcessWorldChanges(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'QUEST_COMPLETION':
                    await batchProcessQuestCompletions(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'ACHIEVEMENT_DIARY_COMPLETION':
                    await batchProcessAchievementDiaries(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'COMBAT_ACHIEVEMENT_COMPLETION':
                    await batchProcessCombatAchievements(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                default:
                    await batchProcessGenericEvents(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
            }
            logger_1.default.info(`Completed batch of ${eventsOfType.length} ${eventType} events in ${Date.now() - typeStartTime}ms`);
        }
        logger_1.default.info(`All events processed in ${Date.now() - eventsProcessingStartTime}ms`);
        logger_1.default.info(`Total Neo4j operation time: ${Date.now() - neo4jStartTime}ms`);
        return {
            success: true,
            eventCount: events.length
        };
    }
    catch (error) {
        logger_1.default.error(`Error in Neo4j operations after ${Date.now() - neo4jStartTime}ms: ${error.message}`);
        throw error;
    }
    finally {
        await session.close();
        logger_1.default.info(`Neo4j session closed after ${Date.now() - neo4jStartTime}ms`);
    }
};
/**
 * Batch process MENU_CLICK events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessMenuClicks = async (session, events, txnUuid, dataUuid, account, playerId) => {
    // Define action type classifications
    const itemActions = [
        'Take', 'Bury', 'Drop', 'Use', 'Examine', 'Eat', 'Drink', 'Equip',
        'Wear', 'Wield', 'Empty', 'Fill', 'Close', 'Read', 'Rub',
        'Open', 'Cast', 'Break', 'Destroy'
    ];
    const characterActions = [
        'Attack', 'Talk-to', 'Trade', 'Pickpocket', 'Examine',
        'Collect', 'Pay'
    ];
    const objectActions = [
        'Climb', 'Open', 'Close', 'Enter', 'Use', 'Search', 'Chop down',
        'Mine', 'Pick', 'Smelt', 'Smith', 'Pray', 'Craft', 'Tan',
        'Cook', 'Catch', 'Cut', 'Bank', 'Exchange', 'Deposit', 'Collect'
    ];
    const playerActions = [
        'Trade with', 'Follow', 'Report', 'Challenge'
    ];
    const interfaceActions = [
        'Walk here', 'Cancel', 'Continue', 'Select', 'Value', 'Buy', 'Sell'
    ];
    // Process events to extract actual character names and categorize by target type
    const processedEvents = events.map(event => {
        // Ensure action is never null
        const action = event.details.action || 'Unknown';
        // Ensure target is never null
        let originalTarget = event.details.target || '';
        let cleanedTarget = cleanTargetText(originalTarget);
        // Make sure cleanedTarget is never null or empty
        if (!cleanedTarget || cleanedTarget.trim() === '') {
            cleanedTarget = `Unknown_${event.eventType}_${event.index}`;
        }
        let hasLevel = originalTarget.includes('(level') || originalTarget.includes('</col>');
        let targetType = 'unknown';
        // Determine target type by level presence
        if (originalTarget.includes('(level')) {
            targetType = 'character';
        }
        // Determine target type by action if not set by level
        if (targetType === 'unknown') {
            if (characterActions.includes(action)) {
                targetType = 'character';
            }
            else if (itemActions.includes(action)) {
                targetType = 'item';
            }
            else if (objectActions.includes(action)) {
                targetType = 'object';
            }
            else if (playerActions.includes(action)) {
                targetType = 'player';
            }
            else if (interfaceActions.includes(action)) {
                targetType = 'interface';
            }
            // Special case: "Examine" is in both character and item actions
            if (action === 'Examine' && !hasLevel && targetType === 'unknown') {
                // Try to guess based on context
                targetType = 'object'; // Default for examine
            }
            // Special case: "Use" is in both item and object actions
            if (action === 'Use' && targetType === 'unknown') {
                // Default to item for Use
                targetType = 'item';
            }
            // Handle other overlapping actions
            if (action === 'Collect' && targetType === 'unknown') {
                // Default to object for Collect
                targetType = 'object';
            }
            if ((action === 'Open' || action === 'Close') && targetType === 'unknown') {
                // Default to object for Open/Close
                targetType = 'object';
            }
        }
        return {
            ...event,
            cleanedTarget,
            hasLevel,
            targetType,
            action
        };
    });
    const params = {
        account,
        playerId,
        events: processedEvents.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            action: event.action,
            target: event.details.target || 'Unknown',
            cleanedTarget: event.cleanedTarget,
            hasLevel: event.hasLevel,
            targetType: event.targetType,
            hasLocation: !!event.playerLocation,
            locationX: event.playerLocation?.x,
            locationY: event.playerLocation?.y,
            locationPlane: event.playerLocation?.plane
        }))
    };
    return await session.executeWrite(tx => {
        // Create all menu click events
        tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
     
      UNWIND $events AS event
      CREATE (e:MenuClickEvent {
        uuid: event.event_uuid,
        eventType: 'MENU_CLICK',
        timestamp: datetime(event.timestamp),
        action: event.action,
        target: event.target,
        targetType: event.targetType
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
    `, params);
        // Handle character targets
        tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClickEvent)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'character' AND NOT EXISTS((e)-->(:Character))
      
      WITH e, e.action AS action, $events AS events
      
      // Get the event data from the events array using the index from the UUID
      WITH e, action, events[toInteger(split(e.uuid, '_')[1])] AS eventData
      
      // Use the already cleaned target name from our parameters with null check
      MERGE (character:Character {name: COALESCE(eventData.cleanedTarget, 'Unknown')})
      ON CREATE SET character.color = "#964B00"
      
      // Add specific relationship based on action
      FOREACH(ignoreMe IN CASE WHEN action = "Attack" THEN [1] ELSE [] END | 
        CREATE (e)-[:ATTACKED]->(character))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Talk-to" THEN [1] ELSE [] END | 
        CREATE (e)-[:TALKED_TO]->(character))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Pickpocket" THEN [1] ELSE [] END | 
        CREATE (e)-[:PICKPOCKETED]->(character))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END | 
        CREATE (e)-[:EXAMINED]->(character))
        
      FOREACH(ignoreMe IN CASE WHEN NOT action IN ["Attack", "Talk-to", "Pickpocket", "Examine"] THEN [1] ELSE [] END | 
        CREATE (e)-[:INTERACTED_WITH]->(character))
    `, params);
        // Handle player targets
        tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClickEvent)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'player' AND NOT EXISTS((e)-->(:Player)) AND e.target <> player.name
      
      WITH e, e.action
      AS action, $events AS events
      
      // Get the event data from the events array
      WITH e, action, events[toInteger(split(e.uuid, '_')[1])] AS eventData
      
      // Use the already cleaned target name with null check
      MERGE (targetPlayer:Player {name: COALESCE(eventData.cleanedTarget, 'Unknown')})
      
      // Add specific relationship based on action
      FOREACH(ignoreMe IN CASE WHEN action = "Trade with" THEN [1] ELSE [] END | 
        CREATE (e)-[:TRADED_WITH]->(targetPlayer))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Follow" THEN [1] ELSE [] END | 
        CREATE (e)-[:FOLLOWED]->(targetPlayer))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Challenge" THEN [1] ELSE [] END | 
        CREATE (e)-[:CHALLENGED]->(targetPlayer))
        
      FOREACH(ignoreMe IN CASE WHEN NOT action IN ["Trade with", "Follow", "Challenge"] THEN [1] ELSE [] END | 
        CREATE (e)-[:INTERACTED_WITH]->(targetPlayer))
    `, params);
        // Handle item targets
        tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClickEvent)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'item' AND NOT EXISTS((e)-->(:Item))
      
      WITH e, e.action AS action, $events AS events
      
      // Get the event data from the events array
      WITH e, action, events[toInteger(split(e.uuid, '_')[1])] AS eventData
      
      // Use the already cleaned target name with null check
      MERGE (item:Item {name: COALESCE(eventData.cleanedTarget, 'Unknown')})
      ON CREATE SET item.color = "#FFD700" // Gold color for items
      
      // Add specific relationship based on action
      FOREACH(ignoreMe IN CASE WHEN action = "Bury" THEN [1] ELSE [] END | 
        CREATE (e)-[:BURIED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Take" THEN [1] ELSE [] END | 
        CREATE (e)-[:COLLECTED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Drop" THEN [1] ELSE [] END | 
        CREATE (e)-[:DROPPED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Eat" OR action = "Drink" THEN [1] ELSE [] END | 
        CREATE (e)-[:CONSUMED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Equip" OR action = "Wear" OR action = "Wield" THEN [1] ELSE [] END | 
        CREATE (e)-[:EQUIPPED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Use" THEN [1] ELSE [] END | 
        CREATE (e)-[:USED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END | 
        CREATE (e)-[:EXAMINED]->(item))
        
      FOREACH(ignoreMe IN CASE WHEN NOT action IN ["Bury", "Take", "Drop", "Eat", "Drink", "Equip", "Wear", "Wield", "Use", "Examine"] THEN [1] ELSE [] END | 
        CREATE (e)-[:INTERACTED_WITH]->(item))
    `, params);
        // Handle object targets
        tx.run(`
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClickEvent)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'object' AND NOT EXISTS((e)-->(:Object))
      
      WITH e, e.action AS action, $events AS events
      
      // Get the event data from the events array
      WITH e, action, events[toInteger(split(e.uuid, '_')[1])] AS eventData
      
      // Use the already cleaned target name with null check
      MERGE (object:Object {name: COALESCE(eventData.cleanedTarget, 'Unknown')})
      ON CREATE SET object.color = "#8B4513" // Brown color for objects
      
      // Add specific relationship based on action
      FOREACH(ignoreMe IN CASE WHEN action = "Mine" THEN [1] ELSE [] END | 
        CREATE (e)-[:MINED]->(object))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Chop down" THEN [1] ELSE [] END | 
        CREATE (e)-[:CHOPPED]->(object))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Craft" OR action = "Smith" OR action = "Cook" THEN [1] ELSE [] END | 
        CREATE (e)-[:CRAFTED_AT]->(object))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Enter" THEN [1] ELSE [] END | 
        CREATE (e)-[:ENTERED]->(object))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END | 
        CREATE (e)-[:EXAMINED]->(object))
        
      FOREACH(ignoreMe IN CASE WHEN NOT action IN ["Mine", "Chop down", "Craft", "Smith", "Cook", "Enter", "Examine"] THEN [1] ELSE [] END | 
        CREATE (e)-[:INTERACTED_WITH]->(object))
    `, params);
        // Handle locations
        return tx.run(`
        MATCH (player:Player {account: $account, playerId: $playerId})
        MATCH (e:MenuClickEvent)-[:PERFORMED_BY]->(player)
        WHERE NOT EXISTS((e)-[:LOCATED_AT]->())
        
        WITH e, $events AS events
        
        // Extract the index from the UUID
        WITH e, events, toInteger(split(e.uuid, '_')[1]) AS eventIndex
        WHERE eventIndex >= 0 AND eventIndex < size(events)
        
        // Check if the event at this index has location data
        WITH e, events[eventIndex] AS eventData
        WHERE eventData.hasLocation = true
        
        MERGE (location:Location {
          x: eventData.locationX,
          y: eventData.locationY, 
          plane: eventData.locationPlane
        })
        CREATE (e)-[:LOCATED_AT]->(location)
      `, params);
    });
};
/**
 * Batch process XP_GAIN events
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
        
        CREATE (e:XpGainEvent {
          uuid: event.event_uuid,
          eventType: 'XP_GAIN',
          timestamp: datetime(event.timestamp),
          skill: event.skill,
          xpGained: event.xpGained,
          totalXp: event.totalXp,
          level: event.level
        })
        CREATE (e)-[:PERFORMED_BY]->(player)
        
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
/**
 * Batch process INVENTORY_CHANGE events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessInventoryChanges = async (session, events, txnUuid, dataUuid, account, playerId) => {
    // Pre-process to check for rare items and ensure no null item names
    const eventsWithRarity = events.map(event => {
        let isRare = false;
        // Here you'd normally call your rarity check function
        // We're mocking it to false for all items now
        // Ensure itemName is never null - use a more robust fallback
        const itemName = (event.details.itemName ? event.details.itemName.trim() : '') ||
            `Unknown Item ${event.details.itemId || `ID_${event.index}`}`;
        return { ...event, isRare, itemName };
    });
    const params = {
        account,
        playerId,
        events: eventsWithRarity.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            itemId: event.details.itemId,
            itemName: event.itemName, // Use our sanitized item name
            isRare: event.isRare,
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
        
        CREATE (e:InventoryChangeEvent {
          uuid: event.event_uuid,
          eventType: 'INVENTORY_CHANGE',
          timestamp: datetime(event.timestamp),
          itemName: COALESCE(event.itemName, 'Unknown Item'),
          isRareItem: event.isRare
        })
        CREATE (e)-[:PERFORMED_BY]->(player)
        
        // Only merge Item node when we have a valid itemId
        FOREACH (ignoreMe IN CASE WHEN event.itemId IS NOT NULL THEN [1] ELSE [] END |
          MERGE (item:Item {itemId: event.itemId})
          SET item.name = COALESCE(event.itemName, 'Unknown Item'),
              item.isRare = event.isRare
          CREATE (e)-[:ADDED]->(item)
        )
        
        // Alternative approach for items without an ID but with a name
        FOREACH (ignoreMe IN CASE WHEN event.itemId IS NULL AND event.itemName <> 'Unknown Item ID Unknown' THEN [1] ELSE [] END |
          MERGE (item:Item {name: COALESCE(event.itemName, 'Unknown Item')})
          SET item.isRare = event.isRare
          CREATE (e)-[:ADDED]->(item)
        )
        
        // Handle locations using FOREACH instead of WHERE/WITH
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
/**
 * Batch process HIT_SPLAT events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessHitSplats = async (session, events, txnUuid, dataUuid, account, playerId) => {
    const params = {
        account,
        playerId,
        events: events.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            damage: event.details.damage,
            target: event.details.target || 'Unknown',
            source: event.details.source || 'Unknown',
            direction: event.details.direction || 'unknown',
            hasLocation: !!event.playerLocation,
            locationX: event.playerLocation?.x,
            locationY: event.playerLocation?.y,
            locationPlane: event.playerLocation?.plane
        }))
    };
    return await session.executeWrite(tx => {
        return tx.run(`
        MATCH (player:Player {account: $account, playerId: $playerId})
        
        // Process all events first to create combat events
        UNWIND $events AS event
        
        // Case 1: NPC attacks player (incoming damage)
        WITH event, player
        WHERE event.direction = 'incoming' AND event.source IS NOT NULL AND event.source <> '' AND event.source <> 'Unknown'
        
        MERGE (character:Character {name: COALESCE(event.source, 'Unknown')})
        ON CREATE SET character.color = "#964B00"
        
        CREATE (e:CombatEvent {
          uuid: event.event_uuid,
          eventType: 'HIT_SPLAT',
          timestamp: datetime(event.timestamp),
          damage: event.damage,
          direction: 'incoming'
        })
        
        // Character → CombatEvent → Player flow
        CREATE (character)-[:PERFORMS]->(e)
        CREATE (e)-[:TARGETED]->(player)
        
        // Location handling for incoming 
        FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
          MERGE (location:Location {
            x: event.locationX,
            y: event.locationY, 
            plane: event.locationPlane
          })
          CREATE (e)-[:LOCATED_AT]->(location)
        )
        
        // Case 2: Player attacks NPC (outgoing damage)
        WITH event, player
        WHERE event.direction = 'outgoing' AND event.target IS NOT NULL AND event.target <> ''
        
        MERGE (character:Character {name: COALESCE(event.target, 'Unknown')})
        ON CREATE SET character.color = "#964B00"
        
        CREATE (e:CombatEvent {
          uuid: event.event_uuid,
          eventType: 'HIT_SPLAT',
          timestamp: datetime(event.timestamp),
          damage: event.damage,
          direction: 'outgoing'
        })
        
        // Player → CombatEvent → Character flow
        CREATE (player)-[:PERFORMS]->(e)
        CREATE (e)-[:TARGETED]->(character)
        
        // Location handling for outgoing
        FOREACH (ignoreMe IN CASE WHEN event.hasLocation = true THEN [1] ELSE [] END |
          MERGE (location:Location {
            x: event.locationX,
            y: event.locationY, 
            plane: event.locationPlane
          })
          CREATE (e)-[:LOCATED_AT]->(location)
        )
        
        // Case 3: Legacy format - assume player is targeting character if no direction specified
        WITH event, player
        WHERE event.direction = 'unknown' AND event.target IS NOT NULL AND event.target <> '' AND event.target <> 'Player'
        
        MERGE (character:Character {name: COALESCE(event.target, 'Unknown')})
        ON CREATE SET character.color = "#964B00"
        
        CREATE (e:CombatEvent {
          uuid: event.event_uuid,
          eventType: 'HIT_SPLAT',
          timestamp: datetime(event.timestamp),
          damage: event.damage
        })
        
        // Player → CombatEvent → Character flow for legacy format
        CREATE (player)-[:PERFORMS]->(e)
        CREATE (e)-[:TARGETED]->(character)
        
        // Location handling for legacy
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
/**
 * Batch process WORLD_CHANGE events
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
        timestamp: datetime(event.timestamp)
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
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
/**
 * Batch process QUEST_COMPLETION events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessQuestCompletions = async (session, events, txnUuid, dataUuid, account, playerId) => {
    const params = {
        account,
        playerId,
        events: events.map(event => ({
            event_uuid: `${dataUuid}_${event.index}`,
            timestamp: event.timestamp,
            questName: event.details.questName || 'Unknown Quest',
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
      
      CREATE (e:QuestCompletionEvent {
        uuid: event.event_uuid,
        eventType: 'QUEST_COMPLETION',
        timestamp: datetime(event.timestamp),
        questName: COALESCE(event.questName, 'Unknown Quest')
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      MERGE (quest:Quest {name: COALESCE(event.questName, 'Unknown Quest')})
      CREATE (e)-[:COMPLETED]->(quest)
      
      WITH e, event
      WHERE event.hasLocation = true
      
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
/**
 * Batch process ACHIEVEMENT_DIARY_COMPLETION events
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
      
      WITH e, event
      WHERE event.hasLocation = true
      
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
/**
 * Batch process COMBAT_ACHIEVEMENT_COMPLETION events
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
        message: event.message
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      
      MERGE (achievement:CombatAchievement {name: COALESCE(event.achievementName, 'Unknown Achievement')})
      CREATE (e)-[:COMPLETED]->(achievement)
      
      WITH e, event
      WHERE event.hasLocation = true
      
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
/**
 * Create game data
 * @route POST /osrs/create
 */
const createGameData = async (req, res, next) => {
    const startTime = Date.now();
    try {
        // Get user from request (set by JWT authentication middleware)
        if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
            throw new error_middleware_1.ApiError(401, 'Authentication required');
        }
        const userRecord = req.user[0];
        const account = userRecord.account;
        const data = req.body;
        logger_1.default.info(`Starting create request for account: ${account}`);
        // Check spam protection
        const request = 'create';
        const spamCheckStartTime = Date.now();
        logger_1.default.info(`Starting spam protection check for ${account}`);
        const { permission } = await spam_protection_1.default.checkSpamProtection(request, account);
        logger_1.default.info(`Spam protection check completed in ${Date.now() - spamCheckStartTime}ms`);
        if (permission === 'block') {
            logger_1.default.warn(`Request frequency limit hit from ${account}`);
            throw new error_middleware_1.ApiError(429, 'The rate limit for this api key has been reached or the registration key is not valid.');
        }
        // Validate data
        if (!data) {
            logger_1.default.warn(`Create request with no data from ${account}`);
            throw new error_middleware_1.ApiError(400, 'No asset provided.');
        }
        // Parse data if it's a string
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        // Generate UUIDs
        const txnUuid = (0, uuid_1.v4)();
        const dataUuid = (0, uuid_1.v4)();
        // Insert data into Neo4j
        const neo4jStartTime = Date.now();
        logger_1.default.info(`Starting Neo4j data insertion for account: ${account}`);
        logger_1.default.info(`Data size: ${typeof data === 'string' ? data.length : JSON.stringify(parsedData).length} bytes`);
        logger_1.default.info(`Event count: ${parsedData.length - 1}`); // First item is player info
        const result = await insertIntoNeo4j(parsedData, txnUuid, dataUuid, account);
        logger_1.default.info(`Neo4j insertion completed in ${Date.now() - neo4jStartTime}ms`);
        // Insert transaction data into SQL database
        const database = process.env.MINDRUNE_DB || 'mindrune';
        const sqlStartTime = Date.now();
        if (database) {
            logger_1.default.info(`Starting SQL insertion`);
            // Transaction header
            const txnQuery = `
        INSERT INTO txn_header (
          txn_id, progress, request, miner, receiver, blockchain, 
          txn_description, data_id, ual, paranet_ual, keywords, 
          epochs, txn_hash, txn_fee, trac_fee, bid, points
        ) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
            const txnParams = [
                txnUuid,
                'PENDING',
                request,
                null,
                account,
                process.env.BLOCKCHAIN || 'ethereum',
                `A txn to mint an action of player for ${account}`,
                dataUuid,
                null,
                process.env.PARANET_UAL || '',
                `MindRune, ${account}`,
                process.env.CREATE_EPOCHS || '1',
                null,
                null,
                null,
                null,
                0,
            ];
            await database_1.default.executeQuery(txnQuery, txnParams, database);
            // Data header
            const dataQuery = `INSERT INTO data_header (data_id, asset_data) VALUES (?,?)`;
            const dataParams = [
                dataUuid,
                typeof data === 'string' ? data : JSON.stringify(data),
            ];
            await database_1.default.executeQuery(dataQuery, dataParams, database);
            logger_1.default.info(`SQL insertion completed in ${Date.now() - sqlStartTime}ms`);
        }
        // Response timing
        logger_1.default.info(`Total request processing time: ${Date.now() - startTime}ms`);
        // Return successful response
        res.status(200).json({
            success: true,
            msg: 'Action data stored in Neo4j successfully!',
            txn_id: txnUuid,
            data_id: dataUuid,
            eventCount: result.eventCount,
        });
    }
    catch (error) {
        logger_1.default.error(`Error processing create request after ${Date.now() - startTime}ms: ${error.message}`);
        next(error);
    }
};
exports.createGameData = createGameData;
/**
 * Execute Neo4j query
 * @route POST /osrs/query
 */
const executeNeo4jQuery = async (req, res, next) => {
    try {
        // Get user from request (set by JWT authentication middleware)
        if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
            throw new error_middleware_1.ApiError(401, 'Authentication required');
        }
        const userRecord = req.user[0];
        const account = userRecord.account;
        const { query, params = {} } = req.body;
        if (!query) {
            throw new error_middleware_1.ApiError(400, 'Query is required');
        }
        // IMPORTANT: Add user ID to params for security
        // This ensures users can only access their own data
        const secureParams = {
            ...params,
            account,
        };
        // Security check: Ensure the query includes account parameter reference
        if (!query.includes('$account')) {
            throw new error_middleware_1.ApiError(400, 'Query must include $account parameter for security');
        }
        // Execute query
        const result = await neo4j_1.default.executeQuery(query, secureParams);
        // Process result
        const processedResult = neo4j_1.default.processQueryResult(result);
        res.status(200).json({
            success: true,
            data: processedResult,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.executeNeo4jQuery = executeNeo4jQuery;
exports.default = {
    createGameData: exports.createGameData,
    executeNeo4jQuery: exports.executeNeo4jQuery,
};
//# sourceMappingURL=osrs.controller.js.map