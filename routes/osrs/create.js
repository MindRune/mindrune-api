require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const web3passport = require("../../util/auth/passport");
const { v4: uuidv4 } = require("uuid");
const neo4j = require("neo4j-driver");
const db = process.env.MINDRUNE_DB;
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const blockchain = process.env.BLOCKCHAIN;
const paranet_ual = process.env.PARANET_UAL;
const epochs = process.env.CREATE_EPOCHS;

// Define point values for different event types
async function getEventTypePoints() {
  try {
    const query = `SELECT event_type, points FROM event_type_points`;
    const results = await queryDB.getData(query, [], db);

    const eventTypePoints = {};
    for (const row of results) {
      eventTypePoints[row.event_type] = row.points;
    }

    return eventTypePoints;
  } catch (error) {
    console.error("Error fetching event type points:", error);

    // Return default values as fallback
    return {
      CombatEvent: 10,
      XpGainEvent: 8,
      InventoryChangeEvent: 7,
      ItemNode: 5,
      Character: 4,
      MenuClickEvent: 3,
      Skill: 2,
      WorldChangeEvent: 1,
      Location: 1,
      Transaction: 0,
    };
  }
}

// Helper function to check if an item is rare (can be expanded with actual game data)
// async function isRareItem(itemId) {
//   try {
//     // Query the OSRS Wiki API
//     const response = await fetch(
//       `${process.env.OSRS_WIKI_HOST}/api.php?action=cargoquery&format=json&tables=Drop&fields=ItemID,ItemName,Rarity,RarityRaw&where=ItemID=${itemId}`
//     );

//     console.log(response)
//     const data = await response.json();

//     if (data.cargoquery && data.cargoquery.length > 0) {
//       // Check if any of the drop sources have a rarity of 1/500 or rarer
//       for (const entry of data.cargoquery) {
//         const rarityRaw = entry.title.RarityRaw;

//         // RarityRaw is usually in the format "1/512" or similar
//         if (rarityRaw && rarityRaw.includes("/")) {
//           const [numerator, denominator] = rarityRaw.split("/").map(Number);

//           // Check if the denominator is 500 or higher (rarer)
//           if (numerator === 1 && denominator >= 500) {
//             return true;
//           }
//         }
//       }
//     }

//     return false;
//   } catch (error) {
//     console.error("Error checking item rarity:", error);
//     return false;
//   }
// }

// Helper function to check for similar messages
function hasSimilarChatInTransaction(
  message,
  previousMessages,
  similarityThreshold = 0.8
) {
  if (!previousMessages || previousMessages.length === 0) return false;

  // Simple similarity check based on character overlap
  for (const prevMsg of previousMessages) {
    const longerMsg = message.length > prevMsg.length ? message : prevMsg;
    const shorterMsg = message.length > prevMsg.length ? prevMsg : message;

    if (shorterMsg.length === 0) continue;

    // Count matching characters
    let matchCount = 0;
    for (let i = 0; i < shorterMsg.length; i++) {
      if (longerMsg.includes(shorterMsg[i])) {
        matchCount++;
      }
    }

    const similarity = matchCount / shorterMsg.length;
    if (similarity >= similarityThreshold) {
      return true;
    }
  }

  return false;
}

// Create Neo4j driver instance
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

function isJsonString(str) {
  try {
    JSON.parse(str);
    return "true";
  } catch (e) {
    return "false";
  }
}

async function getSeasonConfig() {
  // In a production system, this would fetch from DB
  // For now, return a default config
  return {
    seasonId: "default_season",
    name: "Standard Season",
    modifiers: {}, // No modifiers by default
  };
}

async function getQuestScore(questName) {
  try {
    // Sanitize the quest name to handle any special characters
    const sanitizedQuestName = questName.replace(/'/g, "\\'");

    // Query the database for the quest difficulty points
    const query = `
      SELECT difficulty_points 
      FROM osrs_quests 
      WHERE quest_name = ? 
      LIMIT 1
    `;

    const results = await queryDB.getData(query, [sanitizedQuestName], db);

    if (results && results.length > 0) {
      return results[0].difficulty_points;
    }

    // If quest not found in the database, return a default value
    console.warn(
      `Quest "${questName}" not found in database. Returning default points.`
    );
    return 10; // Default to Novice quest points
  } catch (error) {
    console.error(`Error getting quest score for "${questName}":`, error);
    return 10; // Default to Novice quest points on error
  }
}

async function calculatePoints(events, seasonConfig) {
  let totalPoints = 0;
  let eventTypeCounts = {};
  let previousChatMessages = [];
  const EVENT_TYPE_POINTS = await getEventTypePoints();


  // Process each event - replace forEach with for...of to properly handle async
  for (const event of events) {
    // Map event types from the data to the scoring system
    let scoreEventType;

    switch (event.eventType) {
      case "HIT_SPLAT":
        scoreEventType = "CombatEvent";
        break;
      case "XP_GAIN":
        scoreEventType = "XpGainEvent";
        break;
      case "INVENTORY_CHANGE":
        scoreEventType = "InventoryChangeEvent";
        break;
      case "MENU_CLICK":
        scoreEventType = "MenuClickEvent";
        break;
      case "WORLD_CHANGE":
        scoreEventType = "WorldChangeEvent";
        break;
      case "QUEST_COMPLETION":
        scoreEventType = "QuestCompletionEvent";
        break;
      case "ACHIEVEMENT_DIARY_COMPLETION":
        scoreEventType = "AchievementDiaryCompletionEvent";
        break;
      case "COMBAT_ACHIEVEMENT_COMPLETION":
        scoreEventType = "CombatAchievementCompletionEvent";
        break;
      default:
        scoreEventType = event.eventType;
    }

    // Count occurrences of this event type
    eventTypeCounts[scoreEventType] =
      (eventTypeCounts[scoreEventType] || 0) + 1;

    // Get base points for this event type
    let basePoints = EVENT_TYPE_POINTS[scoreEventType] || 0;

    // Apply seasonal modifier if applicable
    if (
      seasonConfig &&
      seasonConfig.modifiers &&
      seasonConfig.modifiers[scoreEventType]
    ) {
      basePoints *= seasonConfig.modifiers[scoreEventType];
    }

    let points = basePoints

    // Apply data quality bonuses
    if (event.playerLocation) points *= 1.1;

    // Event-specific bonuses - all the combat damage checks
    if (scoreEventType === "CombatEvent" && event.details) {
      const damage = Number(event.details.damage);
      
      switch (true) {
        case damage > 40:
          points += damage * 1.2;
          break;
        case damage > 30:
          points += damage * 1.3;
          break;
        case damage > 20:
          points += damage * 1.2;
          break;
        case damage > 10:
          points += damage * 1.1;
          break;
      }
    }

    // XP gain checks
    if (scoreEventType === "XpGainEvent" && event.details) {
      const xpGained = Number(event.details.xpGained);
      
      switch (true) {
        case xpGained > 200:
          points *= 1.3;
          break;
        case xpGained > 100:
          points *= 1.2;
          break;
        case xpGained > 50:
          points *= 1.1;
          break;
      }
    }

    // if (
    //   scoreEventType === "ItemNode" &&
    //   event.details &&
    //   event.details.itemId
    // ) {
    //   const isRare = await isRareItem(event.details.itemId);
    //   if (isRare) {
    //     points *= 1.2;
    //   }
    // }

    // Handle quest completion
    if (scoreEventType === "QuestCompletionEvent" && event.details) {
      const questScore = await getQuestScore(event.details.questName);
      points += questScore;
    }

    if (scoreEventType === "AchievementDiaryCompletionEvent" && event.details) {
        const questScore = await getQuestScore(event.details.questName);
        points += questScore;
      }

      if (scoreEventType === "CombatAchievementCompletionEvent" && event.details) {
        const questScore = await getQuestScore(event.details.questName);
        points += questScore;
      }

    event.points = Math.round(points);
    totalPoints += event.points;
  }

  return totalPoints;
}

// Helper function to insert data into Neo4j
// Helper function to insert data into Neo4j with batch processing
async function insertIntoNeo4j(data, txn_uuid, data_uuid, account) {
  const neo4jStartTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting insertIntoNeo4j for account: ${account}`);
  
  const session = driver.session();

  try {
    // Extract player info and events
    let playerInfo = data[0];
    let events = data.slice(1);
    console.log(`[${new Date().toISOString()}] Processing ${events.length} events`);

    // Get current season configuration
    const seasonConfigStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Getting season config`);
    
    const seasonConfig = await getSeasonConfig();
    
    console.log(`[${new Date().toISOString()}] Season config retrieved in ${Date.now() - seasonConfigStartTime}ms`);

    // Calculate points for this transaction
    const pointsCalculationStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting points calculation for ${events.length} events`);
    
    const totalPoints = await calculatePoints(
      events,
      seasonConfig
    );
    
    console.log(`[${new Date().toISOString()}] Points calculation completed in ${Date.now() - pointsCalculationStartTime}ms, total points: ${totalPoints}`);

    // Create Player node and Transaction node in a single transaction
    const nodesCreationStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Creating player and transaction nodes`);
    
    await session.executeWrite((tx) => {
      return tx.run(
        `
        MERGE (player:Player {account: $account, playerId: $playerId})
        SET player.name = $playerName,
            player.combatLevel = $combatLevel,
            player.lastUpdated = datetime()
        
        WITH player
        
        CREATE (txn:Transaction {
          uuid: $txn_uuid,
          timestamp: datetime(),
          eventCount: $eventCount,
          totalPoints: $totalPoints
        })
        CREATE (txn)-[:ASSOCIATED_WITH]->(player)
        RETURN player, txn
        `,
        {
          account: account,
          playerId: playerInfo.playerId,
          playerName: playerInfo.playerName,
          combatLevel: playerInfo.combatLevel,
          txn_uuid: txn_uuid,
          eventCount: events.length,
          totalPoints: totalPoints
        }
      );
    });
    
    console.log(`[${new Date().toISOString()}] Player and transaction nodes created in ${Date.now() - nodesCreationStartTime}ms`);

    // Group events by type
    const eventsByType = {};
    events.forEach((event, index) => {
      if (!eventsByType[event.eventType]) {
        eventsByType[event.eventType] = [];
      }
      eventsByType[event.eventType].push({...event, index});
    });
    
    console.log(`[${new Date().toISOString()}] Grouped events into ${Object.keys(eventsByType).length} types`);

    // Process each event type in batches
    const eventsProcessingStartTime = Date.now();
    
    for (const eventType in eventsByType) {
      const typeStartTime = Date.now();
      const eventsOfType = eventsByType[eventType];
      console.log(`[${new Date().toISOString()}] Processing batch of ${eventsOfType.length} ${eventType} events`);
      
      switch (eventType) {
        case "MENU_CLICK":
          await batchProcessMenuClicks(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "XP_GAIN":
          await batchProcessXpGains(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "INVENTORY_CHANGE":
          await batchProcessInventoryChanges(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "HIT_SPLAT":
          await batchProcessHitSplats(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "WORLD_CHANGE":
          await batchProcessWorldChanges(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "QUEST_COMPLETION":
          await batchProcessQuestCompletions(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "ACHIEVEMENT_DIARY_COMPLETION":
          await batchProcessAchievementDiaries(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        case "COMBAT_ACHIEVEMENT_COMPLETION":
          await batchProcessCombatAchievements(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
          break;
          
        default:
          await batchProcessGenericEvents(session, eventsOfType, txn_uuid, data_uuid, account, playerInfo.playerId);
      }
      
      console.log(`[${new Date().toISOString()}] Completed batch of ${eventsOfType.length} ${eventType} events in ${Date.now() - typeStartTime}ms`);
    }
    
    console.log(`[${new Date().toISOString()}] All events processed in ${Date.now() - eventsProcessingStartTime}ms`);
    console.log(`[${new Date().toISOString()}] Total Neo4j operation time: ${Date.now() - neo4jStartTime}ms`);

    return {
      success: true,
      eventCount: events.length,
      totalPoints: totalPoints
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Neo4j operations after ${Date.now() - neo4jStartTime}ms:`, error);
    throw error;
  } finally {
    await session.close();
    console.log(`[${new Date().toISOString()}] Neo4j session closed after ${Date.now() - neo4jStartTime}ms`);
  }
}

// Batch process MENU_CLICK events
async function batchProcessMenuClicks(session, events, txn_uuid, data_uuid, account, playerId) {
  // Process events to extract actual character names (without level) and check for level presence
  const processedEvents = events.map(event => {
    let cleanedTarget = event.details.target;
    let hasLevel = false;
    
    // Check if target contains level information (e.g., "Goblin (level 2)")
    if (cleanedTarget && cleanedTarget.includes("(level ")) {
      hasLevel = true;
      // Extract name without the level part
      cleanedTarget = cleanedTarget.split("(level ")[0].trim();
    }
    
    return {
      ...event,
      cleanedTarget,
      hasLevel
    };
  });

  const params = {
    txn_uuid,
    account,
    playerId,
    events: processedEvents.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      action: event.details.action,
      target: event.details.target,
      cleanedTarget: event.cleanedTarget,
      hasLevel: event.hasLevel,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };
  
  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
     
      UNWIND $events AS event
     
      CREATE (e:MenuClickEvent {
        uuid: event.event_uuid,
        eventType: 'MENU_CLICK',
        timestamp: datetime(event.timestamp),
        action: event.action,
        target: event.target,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      // Create or find Character target when there's a valid target with level
      WITH e, event, player
      WHERE event.cleanedTarget IS NOT NULL AND event.cleanedTarget <> "" AND event.hasLevel = true
      
      // First check if target is a player
      OPTIONAL MATCH (existingTarget:Player {name: event.cleanedTarget})
      
      // If it's not a player and has a level, create or find a Character node
      WITH e, event, player, existingTarget
      WHERE existingTarget IS NULL
      
      MERGE (character:Character {name: event.cleanedTarget})
      ON CREATE SET character.color = "#964B00"
      CREATE (e)-[:INTERACTED_WITH]->(character)
      
      // If it was a player, link to that instead
      WITH e, event, player, existingTarget 
      WHERE existingTarget IS NOT NULL
      
      CREATE (e)-[:INTERACTED_WITH]->(existingTarget)
      
      // Handle locations (using MERGE to prevent duplicates)
      WITH e, event
      WHERE event.hasLocation = true
     
      MERGE (location:Location {
        x: event.locationX,
        y: event.locationY,
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Batch process XP_GAIN events
async function batchProcessXpGains(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      skill: event.details.skill,
      xpGained: event.details.xpGained,
      totalXp: event.details.totalXp,
      level: event.details.level,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:XpGainEvent {
        uuid: event.event_uuid,
        eventType: 'XP_GAIN',
        timestamp: datetime(event.timestamp),
        skill: event.skill,
        xpGained: event.xpGained,
        totalXp: event.totalXp,
        level: event.level,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      MERGE (skill:Skill {name: event.skill})
      CREATE (e)-[:RELATED_TO]->(skill)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Batch process INVENTORY_CHANGE events
async function batchProcessInventoryChanges(session, events, txn_uuid, data_uuid, account, playerId) {
  // Pre-process to check for rare items (currently mocked)
  const eventsWithRarity = events.map(event => {
    let isRare = false;
    // Here you'd normally call your rarity check function
    // We're mocking it to false for all items now
    return {...event, isRare};
  });

  const params = {
    txn_uuid,
    account,
    playerId,
    events: eventsWithRarity.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      itemId: event.details.itemId,
      itemName: event.details.itemName || "Unknown Item",
      isRare: event.isRare,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:InventoryChangeEvent {
        uuid: event.event_uuid,
        eventType: 'INVENTORY_CHANGE',
        timestamp: datetime(event.timestamp),
        itemName: event.itemName,
        isRareItem: event.isRare,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      MERGE (item:Item {itemId: event.itemId})
      SET item.name = event.itemName,
          item.isRare = event.isRare
      CREATE (e)-[:ADDED]->(item)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

async function batchProcessHitSplats(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      damage: event.details.damage,
      target: event.details.target,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      // Create combat event
      CREATE (e:CombatEvent {
        uuid: event.event_uuid,
        eventType: 'HIT_SPLAT',
        timestamp: datetime(event.timestamp),
        damage: event.damage,
        target: event.target,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      // Create or find Character target (if not a player)
      WITH e, event, player
      WHERE event.target IS NOT NULL AND event.target <> ""
      
      // First try to find an existing player with this name
      OPTIONAL MATCH (existingTarget:Player {name: event.target})
      
      // If target is not a player, create or merge a Character node
      WITH e, event, player, existingTarget
      WHERE existingTarget IS NULL
      
      MERGE (character:Character {name: event.target})
      ON CREATE SET character.color = "#964B00"
      CREATE (e)-[:TARGETED]->(character)
      
      // If the target was a player, link to that instead
      WITH e, event, player, existingTarget
      WHERE existingTarget IS NOT NULL
      
      CREATE (e)-[:TARGETED]->(existingTarget)
      
      // Handle locations
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Batch process WORLD_CHANGE events
async function batchProcessWorldChanges(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:WorldChangeEvent {
        uuid: event.event_uuid,
        eventType: 'WORLD_CHANGE',
        timestamp: datetime(event.timestamp),
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Batch process QUEST_COMPLETION events
async function batchProcessQuestCompletions(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      questName: event.details.questName,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:QuestCompletionEvent {
        uuid: event.event_uuid,
        eventType: 'QUEST_COMPLETION',
        timestamp: datetime(event.timestamp),
        questName: event.questName,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      MERGE (quest:Quest {name: event.questName})
      CREATE (e)-[:COMPLETED]->(quest)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Batch process ACHIEVEMENT_DIARY_COMPLETION events
async function batchProcessAchievementDiaries(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      diaryName: event.details.diaryName,
      diaryTier: event.details.diaryTier,
      message: event.details.message,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:AchievementDiaryEvent {
        uuid: event.event_uuid,
        eventType: 'ACHIEVEMENT_DIARY_COMPLETION',
        timestamp: datetime(event.timestamp),
        diaryName: event.diaryName,
        diaryTier: event.diaryTier,
        message: event.message,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      MERGE (diary:AchievementDiary {name: event.diaryName})
      SET diary.tier = event.diaryTier
      CREATE (e)-[:COMPLETED]->(diary)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Batch process COMBAT_ACHIEVEMENT_COMPLETION events
async function batchProcessCombatAchievements(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      achievementName: event.details.achievementName,
      message: event.details.message,
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:CombatAchievementEvent {
        uuid: event.event_uuid,
        eventType: 'COMBAT_ACHIEVEMENT_COMPLETION',
        timestamp: datetime(event.timestamp),
        achievementName: event.achievementName,
        message: event.message,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      MERGE (achievement:CombatAchievement {name: event.achievementName})
      CREATE (e)-[:COMPLETED]->(achievement)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// Process generic events that don't fit into standard categories
async function batchProcessGenericEvents(session, events, txn_uuid, data_uuid, account, playerId) {
  const params = {
    txn_uuid,
    account,
    playerId,
    events: events.map(event => ({
      event_uuid: `${data_uuid}_${event.index}`,
      timestamp: event.timestamp,
      eventType: event.eventType,
      details: JSON.stringify(event.details),
      points: event.points || 0,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane
    }))
  };

  return session.executeWrite(tx => {
    return tx.run(`
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      
      UNWIND $events AS event
      
      CREATE (e:GameEvent {
        uuid: event.event_uuid,
        eventType: event.eventType,
        timestamp: datetime(event.timestamp),
        details: event.details,
        points: event.points
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      CREATE (e)-[:PART_OF]->(txn)
      
      WITH e, event
      WHERE event.hasLocation = true
      
      CREATE (location:Location {
        x: event.locationX,
        y: event.locationY, 
        plane: event.locationPlane
      })
      CREATE (e)-[:LOCATED_AT]->(location)
    `, params);
  });
}

// API endpoint for creating new game data
router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting create request for account: ${req.user?.[0]?.account}`);
    
    try {
      let account = req.user[0].account;
      let data = req.body;
      let request = `create`;
      let spamProtection = await queryTypes.spamProtection();
      let keywords = `MindRune, ${account}`; // Add default keywords
      let txn_description = `A txn to mint an action of player for ${account}`; // Add default description

      // Spam protection timing
      const spamCheckStartTime = Date.now();
      console.log(`[${new Date().toISOString()}] Starting spam protection check for ${account}`);
      
      let permission = await spamProtection
        .getData(request, account)
        .then(async ({ permission }) => {
          console.log(`[${new Date().toISOString()}] Spam protection check completed in ${Date.now() - spamCheckStartTime}ms`);
          return permission;
        })
        .catch((error) => {
          console.log(`Error in spam protection: ${error}`);
          console.log(`[${new Date().toISOString()}] Spam protection check failed after ${Date.now() - spamCheckStartTime}ms`);
        });

      if (permission == `block`) {
        console.log(`Request frequency limit hit from ${account}`);
        res.status(429).json({
          success: false,
          msg: "The rate limit for this api key has been reached or the registration key is not valid.",
        });
        return;
      }

      if (!data || data === "") {
        console.log(`Create request with no data from ${account}`);
        res.status(400).json({
          success: false,
          msg: "No asset provided.",
        });
        return;
      }

      // JSON validation timing
      const jsonValidationStartTime = Date.now();
      console.log(`[${new Date().toISOString()}] Starting JSON validation`);
      
      const valid_json = await isJsonString(
        typeof data === "string" || data instanceof String
          ? data
          : JSON.stringify(data)
      );
      
      console.log(`[${new Date().toISOString()}] JSON validation completed in ${Date.now() - jsonValidationStartTime}ms`);
      
      if (valid_json === "false") {
        console.log(`Create request with bad data from ${account}`);
        res.status(400).json({
          success: false,
          msg: "Invalid JSON.",
        });
        return;
      }

      let txn_uuid = uuidv4();
      let data_uuid = uuidv4();

      // Neo4j insertion timing
      const neo4jStartTime = Date.now();
      console.log(`[${new Date().toISOString()}] Starting Neo4j data insertion`);
      console.log(`[${new Date().toISOString()}] Data size: ${typeof data === "string" ? data.length : JSON.stringify(data).length} bytes`);
      console.log(`[${new Date().toISOString()}] Event count: ${data.length - 1}`); // First item is player info
      
      // Insert data into Neo4j
      const result = await insertIntoNeo4j(data, txn_uuid, data_uuid, account);
      
      console.log(`[${new Date().toISOString()}] Neo4j insertion completed in ${Date.now() - neo4jStartTime}ms`);

      // Use calculated points instead of random
      let points = result.totalPoints;

      // SQL insertion timing
      const sqlStartTime = Date.now();
      console.log(`[${new Date().toISOString()}] Starting SQL insertion`);
      
      // Only insert into SQL if db is defined
      if (db) {
        // First SQL query timing
        const sqlQuery1StartTime = Date.now();
        console.log(`[${new Date().toISOString()}] Starting first SQL query (txn_header)`);
        
        query = `INSERT INTO txn_header (txn_id, progress, request, miner, receiver, blockchain, txn_description, data_id, ual, paranet_ual, keywords, epochs, txn_hash, txn_fee, trac_fee, bid, points) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        params = [
          txn_uuid,
          "PENDING",
          request,
          null,
          account,
          blockchain,
          txn_description,
          data_uuid,
          null,
          paranet_ual,
          keywords,
          epochs,
          null,
          null,
          null,
          null,
          points,
        ];

        await queryDB
          .getData(query, params, db)
          .then((results) => {
            console.log(`[${new Date().toISOString()}] First SQL query completed in ${Date.now() - sqlQuery1StartTime}ms`);
            return results;
          })
          .catch((error) => {
            console.error("Error inserting transaction data:", error);
            console.log(`[${new Date().toISOString()}] First SQL query failed after ${Date.now() - sqlQuery1StartTime}ms`);
          });

        // Second SQL query timing
        const sqlQuery2StartTime = Date.now();
        console.log(`[${new Date().toISOString()}] Starting second SQL query (data_header)`);
        console.log(`[${new Date().toISOString()}] Data size for SQL: ${typeof data === "string" ? data.length : JSON.stringify(data).length} bytes`);
        
        query = `INSERT INTO data_header (data_id, asset_data) VALUES (?,?)`;
        params = [
          data_uuid,
          typeof data === "string" || data instanceof String
            ? data
            : JSON.stringify(data),
        ];

        await queryDB
          .getData(query, params, db)
          .then((results) => {
            console.log(`[${new Date().toISOString()}] Second SQL query completed in ${Date.now() - sqlQuery2StartTime}ms`);
            return results;
          })
          .catch((error) => {
            console.error("Error inserting asset data:", error);
            console.log(`[${new Date().toISOString()}] Second SQL query failed after ${Date.now() - sqlQuery2StartTime}ms`);
          });
      }
      
      console.log(`[${new Date().toISOString()}] All SQL operations completed in ${Date.now() - sqlStartTime}ms`);

      // Response timing
      console.log(`[${new Date().toISOString()}] Total request processing time: ${Date.now() - startTime}ms`);
      console.log(`[${new Date().toISOString()}] Sending response with points: ${points}`);
      
      // Include point breakdown in response
      res.status(200).json({
        success: true,
        msg: "Action data stored in Neo4j successfully!",
        txn_id: txn_uuid,
        data_id: data_uuid,
        points: points,
        eventCount: result.eventCount,
      });
    } catch (e) {
      console.log(`[${new Date().toISOString()}] Error processing request after ${Date.now() - startTime}ms:`, e);
      res.status(500).json({
        success: false,
        msg: `Oops, something went wrong! Please try again later.`,
      });
    }
  }
);

// Gracefully close the driver when the application exits
process.on("exit", () => {
  driver.close();
});

module.exports = router;
