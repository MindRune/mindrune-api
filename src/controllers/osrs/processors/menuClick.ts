import { Neo4jSession } from "../../../types/neo4j.types";
import { GameEvent } from "../../../types/api.types";

// Define action type classifications
const itemActions = [
  "Take",
  "Bury",
  "Drop",
  "Use",
  "Examine",
  "Eat",
  "Drink",
  "Equip",
  "Wear",
  "Wield",
  "Empty",
  "Fill",
  "Close",
  "Read",
  "Rub",
  "Open",
  "Cast",
  "Break",
  "Destroy",
  "Clean",
];

const characterActions = [
  "Attack",
  "Talk-to",
  "Trade",
  "Pickpocket",
  "Examine",
  "Collect",
  "Pay",
];

const objectActions = [
  "Climb",
  "Open",
  "Close",
  "Enter",
  "Use",
  "Search",
  "Chop down",
  "Mine",
  "Pick",
  "Smelt",
  "Smith",
  "Pray",
  "Craft",
  "Tan",
  "Cook",
  "Catch",
  "Cut",
  "Bank",
  "Exchange",
  "Deposit",
  "Collect",
];

const playerActions = ["Trade with", "Follow", "Report", "Challenge"];

const interfaceActions = [
  "Walk here",
  "Cancel",
  "Continue",
  "Select",
  "Value",
  "Buy",
  "Sell",
];

/**
 * Determine target type based on action and other context
 * @param action - The action performed
 * @param originalTarget - The original target text
 * @param hasLevel - Whether the target includes level information
 * @returns The determined target type
 */
export const determineTargetType = (
  action: string,
  originalTarget: string,
  hasLevel: boolean
): string => {
  // First check based on level presence
  if (originalTarget.includes("(level")) {
    return "character";
  }

  let targetType = "unknown";

  // Determine by action
  if (characterActions.includes(action)) {
    targetType = "character";
  } else if (itemActions.includes(action)) {
    targetType = "item";
  } else if (objectActions.includes(action)) {
    targetType = "object";
  } else if (playerActions.includes(action)) {
    targetType = "player";
  } else if (interfaceActions.includes(action)) {
    targetType = "interface";
  }

  // Special cases
  if (action === "Examine" && !hasLevel && targetType === "unknown") {
    // Default for examine
    targetType = "object";
  }

  if (action === "Use" && targetType === "unknown") {
    // Default for Use
    targetType = "item";
  }

  if (action === "Collect" && targetType === "unknown") {
    // Default for Collect
    targetType = "object";
  }

  if ((action === "Open" || action === "Close") && targetType === "unknown") {
    // Default for Open/Close
    targetType = "object";
  }

  return targetType;
};

/**
 * Process MENU_CLICK events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
export const batchProcessMenuClicks = async (
  session: Neo4jSession,
  events: (GameEvent & { index: number })[],
  txnUuid: string,
  dataUuid: string,
  account: string,
  playerId: string
): Promise<void> => {
  // Process events to extract actual character names and categorize by target type
  const processedEvents = events.map((event) => {
    // Ensure action is never null
    const action = event.details.action || "Unknown";

    let hasLevel =
    event.details.target.includes("(level") || event.details.target.includes("</col>");
    let targetType = determineTargetType(action, event.details.target, hasLevel);

    // Clean target name here to ensure consistent formatting
    let cleanTarget = event.details.target.replace(/<\/col>$/, '').replace(/\(level.*/, '').trim();

    return {
      ...event,
      targetType,
      cleanTarget
    };
  });

  const params = {
    account,
    playerId,
    events: processedEvents.map((event) => ({
      event_uuid: `${dataUuid}_${event.index}`,
      timestamp: event.timestamp,
      action: event.details.action,
      target: event.cleanTarget, // Use the cleaned target
      targetType: event.targetType,
      hasLocation: !!event.playerLocation,
      locationX: event.playerLocation?.x,
      locationY: event.playerLocation?.y,
      locationPlane: event.playerLocation?.plane,
    })),
  };

  // First, print some diagnostic info
  try {
    const itemDiagnostic = await session.executeRead(tx => 
      tx.run(`
        MATCH (i:Item)
        RETURN i.name AS name, count(i) AS count
        ORDER BY count DESC
        LIMIT 10
      `)
    );
    
    console.log("Current Item counts before processing:");
    itemDiagnostic.records.forEach((record: any) => {
      console.log(`${record.get('name')}: ${record.get('count')}`);
    });
  } catch (err) {
    console.error("Error in diagnostic query:", err);
  }

  return await session.executeWrite(async (tx) => {
    // Create all menu click events first
    await tx.run(
      `
      MATCH (player:Player {account: $account, playerId: $playerId})
     
      UNWIND $events AS event
      CREATE (e:MenuClick {
        uuid: event.event_uuid,
        eventType: 'MENU_CLICK',
        timestamp: datetime(event.timestamp),
        action: event.action,
        target: event.target,
        targetType: event.targetType
      })
      CREATE (e)-[:PERFORMED_BY]->(player)
      `,
      params
    );

    // Process item targets - using a more robust approach
    await tx.run(
      `
      // First, get all events that need item processing
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClick)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'item' AND NOT EXISTS((e)-->(:Item))
      WITH e, e.target AS targetName, e.action AS action
      WHERE targetName IS NOT NULL AND targetName <> ''

      // For each event, create a single transaction
      WITH collect({event: e, targetName: targetName, action: action}) AS eventBatch
      
      UNWIND eventBatch AS eventData
      
      // For each event, MERGE ensures we find or create exactly one item node
      MERGE (item:Item {name: eventData.targetName})
      
      // Set properties only on create to avoid overwriting
      ON CREATE SET item.color = "#FFD700" // Gold color for items
      
      // Now, add specific relationship types based on the action
      WITH eventData.event AS e, eventData.action AS action, item
      
      // Now, create the appropriate relationship type
      FOREACH(ignoreMe IN CASE WHEN action = "Bury" THEN [1] ELSE [] END |
        CREATE (e)-[:BURIED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Take" THEN [1] ELSE [] END |
        CREATE (e)-[:COLLECTED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Drop" THEN [1] ELSE [] END |
        CREATE (e)-[:DROPPED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Destroy" THEN [1] ELSE [] END |
        CREATE (e)-[:DESTROYED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Eat" OR action = "Drink" THEN [1] ELSE [] END |
        CREATE (e)-[:CONSUMED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Equip" OR action = "Wear" OR action = "Wield" THEN [1] ELSE [] END |
        CREATE (e)-[:EQUIPPED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Use" THEN [1] ELSE [] END |
        CREATE (e)-[:USED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END |
        CREATE (e)-[:EXAMINED]->(item))
      
      FOREACH(ignoreMe IN CASE WHEN action = "Clean" THEN [1] ELSE [] END |
        CREATE (e)-[:CLEANED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Bank" THEN [1] ELSE [] END |
        CREATE (e)-[:BANKED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Sell" THEN [1] ELSE [] END |
        CREATE (e)-[:SOLD]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Trade" THEN [1] ELSE [] END |
        CREATE (e)-[:TRADED]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Split" THEN [1] ELSE [] END |
        CREATE (e)-[:SPLIT]->(item))
       
      FOREACH(ignoreMe IN CASE WHEN NOT action IN ["Bury", "Take", "Drop", "Destroy", "Eat", "Drink", "Equip", "Wear", "Wield", "Use", "Examine", "Clean", "Bank", "Sell", "Trade", "Split"] THEN [1] ELSE [] END |
        CREATE (e)-[:INTERACTED_WITH]->(item))
      `,
      params
    );

    // Process character targets in the same pattern
    await tx.run(
      `
      // First, get all events that need character processing
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClick)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'character' AND NOT EXISTS((e)-->(:Character))
      WITH e, e.target AS targetName, e.action AS action
      WHERE targetName IS NOT NULL AND targetName <> ''

      // For each event, create a single transaction
      WITH collect({event: e, targetName: targetName, action: action}) AS eventBatch
      
      UNWIND eventBatch AS eventData
      
      // For each event, MERGE ensures we find or create exactly one character node
      MERGE (character:Character {name: eventData.targetName})
      
      // Set properties only on create to avoid overwriting
      ON CREATE SET character.color = "#964B00"
      
      // Now, add specific relationship types based on the action
      WITH eventData.event AS e, eventData.action AS action, character
      
      // Now, create the appropriate relationship type
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
      `,
      params
    );

    // Process object targets in the same pattern
    await tx.run(
      `
      // First, get all events that need object processing
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClick)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'object' AND NOT EXISTS((e)-->(:Object))
      WITH e, e.target AS targetName, e.action AS action
      WHERE targetName IS NOT NULL AND targetName <> ''

      // For each event, create a single transaction
      WITH collect({event: e, targetName: targetName, action: action}) AS eventBatch
      
      UNWIND eventBatch AS eventData
      
      // For each event, MERGE ensures we find or create exactly one object node
      MERGE (object:Object {name: eventData.targetName})
      
      // Set properties only on create to avoid overwriting
      ON CREATE SET object.color = "#8B4513" // Brown color for objects
      
      // Now, add specific relationship types based on the action
      WITH eventData.event AS e, eventData.action AS action, object
      
      // Mining and Gathering Actions
      FOREACH(ignoreMe IN CASE WHEN action = "Mine" THEN [1] ELSE [] END |
        CREATE (e)-[:MINED]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Prospect" THEN [1] ELSE [] END |
        CREATE (e)-[:PROSPECTED]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Chop down" THEN [1] ELSE [] END |
        CREATE (e)-[:CHOPPED]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Catch" THEN [1] ELSE [] END |
        CREATE (e)-[:CAUGHT]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Trap" THEN [1] ELSE [] END |
        CREATE (e)-[:TRAPPED]->(object))
       
      // Crafting Actions (Separated)
      FOREACH(ignoreMe IN CASE WHEN action = "Craft" THEN [1] ELSE [] END |
        CREATE (e)-[:CRAFT]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Smith" THEN [1] ELSE [] END |
        CREATE (e)-[:SMITH]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Cook" THEN [1] ELSE [] END |
        CREATE (e)-[:COOK]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Spin" THEN [1] ELSE [] END |
        CREATE (e)-[:SPIN]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Tan" THEN [1] ELSE [] END |
        CREATE (e)-[:TAN]->(object))
       
      // Movement and Navigation
      FOREACH(ignoreMe IN CASE WHEN action = "Enter" THEN [1] ELSE [] END |
        CREATE (e)-[:ENTER]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Climb" THEN [1] ELSE [] END |
        CREATE (e)-[:CLIMB]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Open" THEN [1] ELSE [] END |
        CREATE (e)-[:OPEN]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Close" THEN [1] ELSE [] END |
        CREATE (e)-[:CLOSE]->(object))
       
      // Interaction and Information
      FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END |
        CREATE (e)-[:EXAMINE]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Search" THEN [1] ELSE [] END |
        CREATE (e)-[:SEARCHE]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Investigate" THEN [1] ELSE [] END |
        CREATE (e)-[:INVESTIGATE]->(object))
       
      // Resource Processing
      FOREACH(ignoreMe IN CASE WHEN action = "Deposit" THEN [1] ELSE [] END |
        CREATE (e)-[:DEPOSIT]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Withdraw" THEN [1] ELSE [] END |
        CREATE (e)-[:WITHDRAW]->(object))
       
      // Maintenance and Repair
      FOREACH(ignoreMe IN CASE WHEN action = "Repair" THEN [1] ELSE [] END |
        CREATE (e)-[:REPAIR]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Fix" THEN [1] ELSE [] END |
        CREATE (e)-[:FIX]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Restore" THEN [1] ELSE [] END |
        CREATE (e)-[:RESTORE]->(object))
       
      // Additional Interactions
      FOREACH(ignoreMe IN CASE WHEN action = "Fill" THEN [1] ELSE [] END |
        CREATE (e)-[:FILL]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Empty" THEN [1] ELSE [] END |
        CREATE (e)-[:EMPTY]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Light" THEN [1] ELSE [] END |
        CREATE (e)-[:LIGHT]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Extinguish" THEN [1] ELSE [] END |
        CREATE (e)-[:EXTINGUISH]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Pick" THEN [1] ELSE [] END |
        CREATE (e)-[:PICK]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Read" THEN [1] ELSE [] END |
        CREATE (e)-[:READ]->(object))
       
      FOREACH(ignoreMe IN CASE WHEN action = "Push" THEN [1] ELSE [] END |
        CREATE (e)-[:PUSH]->(object))
       
      // Catch-all for any actions not explicitly defined
      FOREACH(ignoreMe IN CASE WHEN NOT action IN [
        "Mine", "Prospect", "Chop down", "Chop", "Fish", "Trap", 
        "Craft", "Smith", "Cook", "Spin", "Tan", 
        "Enter", "Climb", "Open", "Close", "Catch",
        "Examine", "Search", "Investigate", 
        "Deposit", "Withdraw", 
        "Repair", "Fix", "Restore",
        "Fill", "Empty", "Light", "Extinguish", "Pick", "Read", "Push"
      ] THEN [1] ELSE [] END |
        CREATE (e)-[:INTERACTED_WITH]->(object))
      `,
      params
    );

    // Process player targets in the same pattern
    await tx.run(
      `
      // First, get all events that need player processing
      MATCH (player:Player {account: $account, playerId: $playerId})
      MATCH (e:MenuClick)-[:PERFORMED_BY]->(player)
      WHERE e.targetType = 'player' AND NOT EXISTS((e)-->(:Player)) AND e.target <> player.name
      WITH e, e.target AS targetName, e.action AS action
      WHERE targetName IS NOT NULL AND targetName <> ''

      // For each event, create a single transaction
      WITH collect({event: e, targetName: targetName, action: action}) AS eventBatch
      
      UNWIND eventBatch AS eventData
      
      // For each event, MERGE ensures we find or create exactly one player node
      MERGE (targetPlayer:Player {name: eventData.targetName})
      
      // Now, add specific relationship types based on the action
      WITH eventData.event AS e, eventData.action AS action, targetPlayer
      
      // Now, create the appropriate relationship type
      FOREACH(ignoreMe IN CASE WHEN action = "Trade with" THEN [1] ELSE [] END | 
        CREATE (e)-[:TRADED_WITH]->(targetPlayer))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Follow" THEN [1] ELSE [] END | 
        CREATE (e)-[:FOLLOWED]->(targetPlayer))
        
      FOREACH(ignoreMe IN CASE WHEN action = "Challenge" THEN [1] ELSE [] END | 
        CREATE (e)-[:CHALLENGED]->(targetPlayer))

      FOREACH(ignoreMe IN CASE WHEN action = "Attack" THEN [1] ELSE [] END | 
        CREATE (e)-[:ATTACKED]->(targetPlayer))
        
      FOREACH(ignoreMe IN CASE WHEN NOT action IN ["Trade with", "Follow", "Challenge", "Attacked"] THEN [1] ELSE [] END | 
        CREATE (e)-[:INTERACTED_WITH]->(targetPlayer))
      `,
      params
    );

    // Handle locations
    return tx.run(
      `
        MATCH (player:Player {account: $account, playerId: $playerId})
        MATCH (e:MenuClick)-[:PERFORMED_BY]->(player)
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
      `,
      params
    );
  });
};

export default batchProcessMenuClicks;