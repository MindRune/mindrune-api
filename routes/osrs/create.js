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

async function isNewPlayer(account, playerId) {
  const session = driver.session();
  try {
    const result = await session.executeRead((tx) => {
      return tx.run(
        `
        MATCH (player:Player {account: $account, playerId: $playerId})
        RETURN count(player) as playerCount
      `,
        { account, playerId }
      );
    });

    // If no players found, this is a new player
    return result.records[0].get("playerCount").toNumber() === 0;
  } catch (error) {
    console.error("Error checking if player is new:", error);
    return false;
  } finally {
    await session.close();
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

async function calculatePoints(events, isNewPlayer, seasonConfig) {
  let totalPoints = 0;
  let eventTypeCounts = {};
  let previousChatMessages = [];
  const EVENT_TYPE_POINTS = await getEventTypePoints();

  // Add new player bonus
  if (isNewPlayer) {
    totalPoints += 100;
  }

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
// Helper function to insert data into Neo4j
async function insertIntoNeo4j(data, txn_uuid, data_uuid, account) {
  const neo4jStartTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting insertIntoNeo4j for account: ${account}`);
  
  const session = driver.session();

  try {
    // Extract player info and events
    let playerInfo = data[0];
    let events = data.slice(1);
    console.log(`[${new Date().toISOString()}] Processing ${events.length} events`);

    // Check if this is a new player
    const isPlayerNewStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Checking if player is new`);
    
    const isPlayerNew = await isNewPlayer(account, playerInfo.playerId);
    
    console.log(`[${new Date().toISOString()}] isNewPlayer check completed in ${Date.now() - isPlayerNewStartTime}ms, result: ${isPlayerNew}`);

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
      isPlayerNew,
      seasonConfig
    );
    
    console.log(`[${new Date().toISOString()}] Points calculation completed in ${Date.now() - pointsCalculationStartTime}ms, total points: ${totalPoints}`);

    // Create Player node based on both account and playerId
    const playerNodeStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Creating/updating player node`);
    
    await session.executeWrite((tx) => {
      return tx.run(
        `
    MERGE (player:Player {account: $account, playerId: $playerId})
    SET player.name = $playerName,
        player.combatLevel = $combatLevel,
        player.lastUpdated = datetime()
    RETURN player
  `,
        {
          account: account,
          playerId: playerInfo.playerId,
          playerName: playerInfo.playerName,
          combatLevel: playerInfo.combatLevel,
        }
      );
    });
    
    console.log(`[${new Date().toISOString()}] Player node operation completed in ${Date.now() - playerNodeStartTime}ms`);

    // Create Transaction node with points and link to the correct player
    const txnNodeStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Creating transaction node`);
    
    await session.executeWrite((tx) => {
      return tx.run(
        `
    CREATE (txn:Transaction {
      uuid: $txn_uuid,
      timestamp: datetime(),
      eventCount: $eventCount,
      totalPoints: $totalPoints,
      isNewPlayer: $isNewPlayer
    })
    WITH txn
    MATCH (player:Player {account: $account, playerId: $playerId})
    CREATE (txn)-[:ASSOCIATED_WITH]->(player)
    RETURN txn
  `,
        {
          txn_uuid: txn_uuid,
          eventCount: events.length,
          account: account,
          playerId: playerInfo.playerId,
          totalPoints: totalPoints,
          isNewPlayer: isPlayerNew,
        }
      );
    });
    
    console.log(`[${new Date().toISOString()}] Transaction node created in ${Date.now() - txnNodeStartTime}ms`);

    // Process each event
    const eventsProcessingStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting to process ${events.length} events`);
    
    for (let i = 0; i < events.length; i++) {
      const eventStartTime = Date.now();
      const event = events[i];
      console.log(`[${new Date().toISOString()}] Processing event ${i+1}/${events.length}, type: ${event.eventType}`);
      
      // Base event properties
      const eventParams = {
        event_uuid: `${data_uuid}_${i}`,
        txn_uuid: txn_uuid,
        account: account,
        playerId: playerInfo.playerId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        eventPoints: event.points || 0, // Add points to event
      };

      // Add location if available
      if (event.playerLocation) {
        eventParams.locationX = event.playerLocation.x;
        eventParams.locationY = event.playerLocation.y;
        eventParams.locationPlane = event.playerLocation.plane;
      }

      // Process event by type
      switch (event.eventType) {
        case "MENU_CLICK":
          await session.executeWrite((tx) => {
            return tx.run(
              `
              MATCH (txn:Transaction {uuid: $txn_uuid})
              MATCH (player:Player {account: $account, playerId: $playerId})
              CREATE (event:MenuClickEvent {
                uuid: $event_uuid,
                eventType: $eventType,
                timestamp: datetime($timestamp),
                action: $action,
                target: $target,
                points: $eventPoints
              })
              CREATE (event)-[:PERFORMED_BY]->(player)
              CREATE (event)-[:PART_OF]->(txn)
              ${
                event.playerLocation
                  ? `
              CREATE (location:Location {
                x: $locationX,
                y: $locationY,
                plane: $locationPlane
              })
              CREATE (event)-[:LOCATED_AT]->(location)
              `
                  : ""
              }
              RETURN event
            `,
              {
                ...eventParams,
                action: event.details.action,
                target: event.details.target,
              }
            );
          });
          break;

        case "XP_GAIN":
          await session.executeWrite((tx) => {
            return tx.run(
              `
              MATCH (txn:Transaction {uuid: $txn_uuid})
              MATCH (player:Player {account: $account, playerId: $playerId})
              CREATE (event:XpGainEvent {
                uuid: $event_uuid,
                eventType: $eventType,
                timestamp: datetime($timestamp),
                skill: $skill,
                xpGained: $xpGained,
                totalXp: $totalXp,
                level: $level,
                points: $eventPoints
              })
              CREATE (event)-[:PERFORMED_BY]->(player)
              CREATE (event)-[:PART_OF]->(txn)
              ${
                event.playerLocation
                  ? `
              CREATE (location:Location {
                x: $locationX,
                y: $locationY,
                plane: $locationPlane
              })
              CREATE (event)-[:LOCATED_AT]->(location)
              `
                  : ""
              }
              
              MERGE (skill:Skill {name: $skill})
              CREATE (event)-[:RELATED_TO]->(skill)
              
              RETURN event
            `,
              {
                ...eventParams,
                skill: event.details.skill,
                xpGained: event.details.xpGained,
                totalXp: event.details.totalXp,
                level: event.details.level,
              }
            );
          });
          break;

        case "INVENTORY_CHANGE":
          // Check if the item is rare before the transaction
          let isRare = false;
          try {
            if (event.details && event.details.itemId) {
              //isRare = await isRareItem(event.details.itemId);
              isRare = 0
            }
          } catch (error) {
            console.error("Error checking item rarity:", error);
          }

          await session.executeWrite((tx) => {
            return tx.run(
              `
        MATCH (txn:Transaction {uuid: $txn_uuid})
        MATCH (player:Player {account: $account, playerId: $playerId})
        CREATE (event:InventoryChangeEvent {
          uuid: $event_uuid,
          eventType: $eventType,
          timestamp: datetime($timestamp),
          points: $eventPoints,
          itemName: $itemName,
          isRareItem: $isRare
        })
        CREATE (event)-[:PERFORMED_BY]->(player)
        CREATE (event)-[:PART_OF]->(txn)
        ${
          event.playerLocation
            ? `
        CREATE (location:Location {
          x: $locationX,
          y: $locationY,
          plane: $locationPlane
        })
        CREATE (event)-[:LOCATED_AT]->(location)
        `
            : ""
        }
        
        MERGE (item:Item {itemId: $itemId})
        SET item.name = $itemName,
            item.isRare = $isRare
        CREATE (event)-[:ADDED]->(item)
        
        RETURN event
      `,
              {
                ...eventParams,
                itemId: event.details.itemId,
                itemName: event.details.itemName || "Unknown Item",
                isRare: isRare,
              }
            );
          });
          break;

        case "HIT_SPLAT":
          await session.executeWrite((tx) => {
            return tx.run(
              `
                MATCH (txn:Transaction {uuid: $txn_uuid})
                MATCH (player:Player {account: $account, playerId: $playerId})
                CREATE (event:CombatEvent {
                  uuid: $event_uuid,
                  eventType: $eventType,
                  timestamp: datetime($timestamp),
                  damage: $damage,
                  target: $target,
                  points: $eventPoints
                })
                CREATE (event)-[:PERFORMED_BY]->(player)
                CREATE (event)-[:PART_OF]->(txn)
                ${
                  event.playerLocation
                    ? `
                CREATE (location:Location {
                  x: $locationX,
                  y: $locationY,
                  plane: $locationPlane
                })
                CREATE (event)-[:LOCATED_AT]->(location)
                `
                    : ""
                }
               
                // Check if the target matches the player's name
                WITH event, player
                CALL {
                  WITH event, player
                  MATCH (target)
                  WHERE 
                    (target:Player AND target.name = $target) OR 
                    (target:Character AND target.name = $target)
                  CREATE (event)-[:TARGETED]->(target)
                  RETURN target
                }
               
                RETURN event
              `,
              {
                ...eventParams,
                damage: event.details.damage,
                target: event.details.target,
              }
            );
          });
          break;

        case "QUEST_COMPLETION":
          await session.executeWrite((tx) => {
            return tx.run(
              `
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      CREATE (event:QuestCompletionEvent {
        uuid: $event_uuid,
        eventType: $eventType,
        timestamp: datetime($timestamp),
        questName: $questName,
        points: $eventPoints
      })
      CREATE (event)-[:PERFORMED_BY]->(player)
      CREATE (event)-[:PART_OF]->(txn)
      ${
        event.playerLocation
          ? `
      CREATE (location:Location {
        x: $locationX,
        y: $locationY,
        plane: $locationPlane
      })
      CREATE (event)-[:LOCATED_AT]->(location)
      `
          : ""
      }
      
      MERGE (quest:Quest {name: $questName})
      SET quest.difficulty = $difficulty,
          quest.questPoints = $questPoints
      CREATE (event)-[:COMPLETED]->(quest)
      
      RETURN event
    `,
              {
                ...eventParams,
                questName: event.details.questName,
              }
            );
          });
          break;

        case "ACHIEVEMENT_DIARY_COMPLETION":
          await session.executeWrite((tx) => {
            return tx.run(
              `
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      CREATE (event:AchievementDiaryEvent {
        uuid: $event_uuid,
        eventType: $eventType,
        timestamp: datetime($timestamp),
        diaryName: $diaryName,
        diaryTier: $diaryTier,
        message: $message,
        points: $eventPoints
      })
      CREATE (event)-[:PERFORMED_BY]->(player)
      CREATE (event)-[:PART_OF]->(txn)
      ${
        event.playerLocation
          ? `
      CREATE (location:Location {
        x: $locationX,
        y: $locationY,
        plane: $locationPlane
      })
      CREATE (event)-[:LOCATED_AT]->(location)
      `
          : ""
      }
      
      MERGE (diary:AchievementDiary {name: $diaryName})
      SET diary.tier = $diaryTier
      CREATE (event)-[:COMPLETED]->(diary)
      
      RETURN event
    `,
              {
                ...eventParams,
                diaryName: event.details.diaryName,
                diaryTier: event.details.diaryTier,
                message: event.details.message,
              }
            );
          });
          break;

        case "COMBAT_ACHIEVEMENT_COMPLETION":
          await session.executeWrite((tx) => {
            return tx.run(
              `
      MATCH (txn:Transaction {uuid: $txn_uuid})
      MATCH (player:Player {account: $account, playerId: $playerId})
      CREATE (event:CombatAchievementEvent {
        uuid: $event_uuid,
        eventType: $eventType,
        timestamp: datetime($timestamp),
        achievementName: $achievementName,
        message: $message,
        points: $eventPoints
      })
      CREATE (event)-[:PERFORMED_BY]->(player)
      CREATE (event)-[:PART_OF]->(txn)
      ${
        event.playerLocation
          ? `
      CREATE (location:Location {
        x: $locationX,
        y: $locationY,
        plane: $locationPlane
      })
      CREATE (event)-[:LOCATED_AT]->(location)
      `
          : ""
      }
      
      MERGE (achievement:CombatAchievement {name: $achievementName})
      CREATE (event)-[:COMPLETED]->(achievement)
      
      RETURN event
    `,
              {
                ...eventParams,
                achievementName: event.details.achievementName,
                message: event.details.message,
              }
            );
          });
          break;

        case "WORLD_CHANGE":
          await session.executeWrite((tx) => {
            return tx.run(
              `
              MATCH (txn:Transaction {uuid: $txn_uuid})
              MATCH (player:Player {account: $account, playerId: $playerId})
              CREATE (event:WorldChangeEvent {
                uuid: $event_uuid,
                eventType: $eventType,
                timestamp: datetime($timestamp),
                points: $eventPoints
              })
              CREATE (event)-[:PERFORMED_BY]->(player)
              CREATE (event)-[:PART_OF]->(txn)
              ${
                event.playerLocation
                  ? `
              CREATE (location:Location {
                x: $locationX,
                y: $locationY,
                plane: $locationPlane
              })
              CREATE (event)-[:LOCATED_AT]->(location)
              `
                  : ""
              }
              RETURN event
            `,
              eventParams
            );
          });
          break;

        default:
          // Generic event handling for unknown types
          await session.executeWrite((tx) => {
            return tx.run(
              `
              MATCH (txn:Transaction {uuid: $txn_uuid})
              MATCH (player:Player {account: $account, playerId: $playerId})
              CREATE (event:GameEvent {
                uuid: $event_uuid,
                eventType: $eventType,
                timestamp: datetime($timestamp),
                details: $details,
                points: $eventPoints
              })
              CREATE (event)-[:PERFORMED_BY]->(player)
              CREATE (event)-[:PART_OF]->(txn)
              ${
                event.playerLocation
                  ? `
              CREATE (location:Location {
                x: $locationX,
                y: $locationY,
                plane: $locationPlane
              })
              CREATE (event)-[:LOCATED_AT]->(location)
              `
                  : ""
              }
              RETURN event
            `,
              {
                ...eventParams,
                details: JSON.stringify(event.details),
              }
            );
          });
      }
      
      console.log(`[${new Date().toISOString()}] Event ${i+1} (${event.eventType}) processed in ${Date.now() - eventStartTime}ms`);
    }
    
    console.log(`[${new Date().toISOString()}] All events processed in ${Date.now() - eventsProcessingStartTime}ms`);
    console.log(`[${new Date().toISOString()}] Total Neo4j operation time: ${Date.now() - neo4jStartTime}ms`);

    return {
      success: true,
      eventCount: events.length,
      totalPoints: totalPoints,
      isNewPlayer: isPlayerNew,
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Neo4j operations after ${Date.now() - neo4jStartTime}ms:`, error);
    throw error;
  } finally {
    await session.close();
    console.log(`[${new Date().toISOString()}] Neo4j session closed after ${Date.now() - neo4jStartTime}ms`);
  }
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
