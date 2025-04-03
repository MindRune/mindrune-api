"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessMenuClicks = exports.determineTargetType = void 0;
const objectActions = [
    // Mining
    "Mine",
    "Prospect",
    "Collect-ore",
    "Break",
    "Chip",
    "Blast",
    "Crush rock",
    "Collect gems",
    "Reinforce",
    // Woodcutting
    "Chop down",
    "Chop",
    "Cut down",
    "Fell",
    "Collect logs",
    "Saw",
    // Fishing
    "Fish",
    "Harpoon",
    "Net",
    "Bait",
    "Lure",
    "Cage",
    "Trawl",
    "Spear",
    "Fly fish",
    "Bait pot",
    "Check net",
    "Collect",
    "Haul in",
    "Deposit catch",
    "Clean catch",
    // Hunter
    "Trap",
    "Check-trap",
    "Lay-trap",
    "Dismantle-trap",
    "Track",
    "Flush",
    "Bait",
    "Hunt",
    "Stalk",
    "Call",
    "Catch impling",
    "Set snare",
    "Set pitfall",
    "Set deadfall",
    "Set box trap",
    "Release",
    "Collect furs",
    "Collect feathers",
    // Crafting
    "Craft",
    "Spin",
    "Weave",
    "Mould",
    "Glassblowing",
    "Silver-craft",
    "Chisel",
    "Etch",
    "Polish",
    "Thread",
    "Needle",
    "Loom",
    "Tan hide",
    "Shape glass",
    "Fire pottery",
    "Glaze",
    "Dye",
    // Smithing
    "Smith",
    "Smelt",
    "Hammer",
    "Forge",
    "Plate",
    "Refine",
    "Heat",
    "Quench",
    "Anneal",
    "Temper",
    "Cast metal",
    "Fold metal",
    "Rivet",
    "Weld",
    "Sharpen",
    "Grind",
    // Cooking
    "Use-stove",
    "Use-range",
    // Farming
    "Plant",
    "Harvest",
    "Rake",
    "Compost",
    "Cure-plant",
    "Water",
    "Fertilize",
    "Weed",
    "Prune",
    "Dig",
    "Sow seeds",
    "Transplant",
    "Pollinate",
    "Graft",
    "Scarecrow",
    "Inspect",
    "Stake",
    "Support",
    "Irrigate",
    "Prune",
    "Strip-bark",
    "Check-health",
    // Construction
    "Build",
    "Remove",
    "Move",
    "Rotate",
    "Customize",
    "Plan",
    "Decorate",
    "Renovate",
    "Expand",
    "Reinforce",
    "Paint",
    "Wallpaper",
    "Replace",
    "Upgrade",
    "Repair",
    "Demolish",
    "Measure",
    "Design",
    "Blueprint",
    // Prayer
    "Pray",
    "Offer",
    "Sacrifice",
    "Worship",
    "Cleanse",
    "Bless",
    "Consecrate",
    "Meditate",
    "Chant",
    "Ritual",
    "Anoint",
    "Sanctify",
    "Bury bones",
    "Scatter ashes",
    "Commune",
    "Recite",
    "Hymn",
    "Invocation",
    "Kneel",
    // Agility
    "Climb",
    "Cross",
    "Balance",
    "Jump",
    "Swing",
    "Squeeze-through",
    "Vault",
    "Leap",
    "Hurdle",
    "Navigate",
    "Scale",
    "Descend",
    "Grip",
    "Slide",
    "Dive",
    "Roll",
    "Tumble",
    "Shimmy",
    "Hang",
    "Scramble",
    // Runecraft
    "Craft-rune",
    "Bind",
    "Infuse",
    "Talisman",
    "Imbue",
    "Channel",
    "Focus",
    "Meditate",
    "Concentrate",
    "Align",
    "Draw power",
    "Harness",
    "Extract energy",
    "Condense",
    "Purify",
    "Filter",
    "Distill",
    "Divide",
    // Magic
    "Cast-on",
    "Channel",
    "Activate",
    "Teleport-to",
    "Charge",
    "Spellbook",
    "Focus",
    "Attune",
    "Absorb",
    "Harvest energy",
    "Convert energy",
    "Store energy",
    "Release energy",
    "Bind",
    "Curse",
    "Hex",
    "Dispel",
    "Counterspell",
    // Firemaking
    "Light-fire",
    "Light",
    "Add-logs",
    "Extinguish",
    "Stoke",
    "Feed fire",
    "Bank cinders",
    "Light beacon",
    "Signal",
    "Build pyre",
    "Create bonfire",
    "Warm hands",
    "Arrange logs",
    "Prepare kindling",
    "Light kindling",
    "Light torch",
    "Light lantern",
    "Fill lantern",
    "Clean lantern",
    "Adjust flame",
    // Thieving
    "Steal from",
    "Pickpocket",
    "Crack",
    "Lockpick",
    "Disable trap",
    "Detect trap",
    "Deactivate",
    "Hide",
    "Sneak",
    "Distract",
    "Peek",
    "Scout",
    "Case",
    "Mark",
    "Break in",
    "Pick safe",
    "Crack safe",
    "Bypass",
    "Duplicate key",
    "Force",
    "Tamper",
    "Pilfer",
    "Lift",
    "Palm",
    "Switch",
    "Con",
    // Combat/Attack/Strength/Defense
    "Attack",
    "Defend",
    "Block",
    "Parry",
    "Counter",
    "Strike",
    "Slash",
    "Stab",
    "Crush",
    "Bash",
    "Slam",
    "Pound",
    "Train on",
    "Spar with",
    "Dummy",
    "Practice on",
    "Dodge",
    "Shield",
    "Target",
    "Equip rack",
    // General object interactions
    "Enter",
    "Open",
    "Close",
    "Catch",
    "Examine",
    "Search",
    "Investigate",
    "Deposit",
    "Withdraw",
    "Repair",
    "Fix",
    "Restore",
    "Fill",
    "Empty",
    "Light",
    "Extinguish",
    "Pick",
    "Read",
    "Push",
    "Use",
    "Bank",
    "Exchange",
    "Burn",
    "Charge",
    "Pull",
    "Rotate",
    "Turn",
    "Drink from",
    "Roll",
    "Shake",
    "Operate",
    "Manipulate",
    "Combine with",
    "Listen to",
    "Peek",
    "Look through",
    "Kick",
    "Adjust",
    "Tune",
    "Pry",
    "Steal from",
    "Activate",
    "Deactivate",
    "Flip",
    "Touch",
    "Clean",
    "Wash",
    "Dry",
    "Scrub",
    "Polish",
    "Ignite",
    "Douse",
    "Connect",
    "Disconnect",
    "Insert",
    "Remove from",
    "Bolt",
    "Screw",
    "Nail",
    "Wedge",
    "Stoke",
    "Feed",
    "Board",
    "Disembark",
    "Cast on",
    "Tether",
    "Untether",
    // Additional General Interactions
    "Unlock",
    "Force",
    "Pick-lock",
    "Disarm",
    "Clear",
    "Detonate",
    "Sabotage",
    "Disable",
    "Enable",
    "Reset",
    "Override",
    "Hack",
    "Configure",
    "Set up",
    "Take down",
    "Assemble",
    "Disassemble",
    "Mount",
    "Dismount",
    "Flip over",
    "Turn upside down",
    "Face",
    "Point at",
    "Direct toward",
    "Align with",
    "Center on",
    "Adjust position",
    "Fine-tune",
    "Calibrate",
    "Zero in",
    "Target lock",
];
const itemActions = [
    // Basic item interactions
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
    "Unequip",
    "Remove",
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
    "Bank",
    "Sell",
    "Trade",
    "Split",
    "Combine",
    "Check",
    "Dismantle",
    "Store",
    "Withdraw",
    "Note",
    "Un-note",
    "Claim",
    "Inspect",
    "Operate",
    "Toggle",
    "Configure",
    // Magic
    "Alchemy",
    "High Alchemy",
    "High-Alchemy",
    "Enchant",
    // Herblore
    "Identify",
    "Mix",
    "Crush",
    "Grind",
    "Dose",
    "Decant",
    "Clean herb",
    "Make unf",
    "Make tar",
    "Pot",
    "Strain",
    "Filter",
    "Distill",
    "Ferment",
    "Brew",
    "Test",
    "Sample",
    "Identify herb",
    "Collect herb",
    "Combine ingredients",
    "Add secondary",
    "Add tertiary",
    "Finalize mixture",
    "Bottle",
    "Label",
    "Catalogue",
    "Store mixture",
    "Measure",
    "Boil",
    "Heat solution",
    // Cooking
    "Cook",
    "Bake",
    "Brew",
    "Ferment",
    "Fry",
    "Slice",
    "Dice",
    "Churn",
    "Squeeze",
    "Dry",
    "Stuff",
    "Wrap",
    "Roast",
    "Boil",
    "Chop",
    "Grill",
    "Scramble",
    "Toast",
    "Simmer",
    "Marinate",
    "Tenderize",
    "Season",
    "Mix ingredients",
    "Whisk",
    "Knead",
    "Stir",
    "Taste",
    "Prepare",
    "Preserve",
    "Smoke",
    "Cure",
    "Pickle",
    "Arrange",
    "Serve",
    // Crafting
    "String",
    "Cut",
    "Polish",
    "Thread",
    "Attach",
    "Stamp",
    "Engrave",
    "Chisel",
    "Glaze",
    "Dye",
    "Unfired",
    "Leather",
    "Emblem",
    "Stitch",
    "Set",
    "Weave",
    "Braid",
    "Knit",
    "Crochet",
    "Embroider",
    "Sew",
    "Tan",
    "Craft leather",
    "Cut gem",
    "Set gem",
    "String beads",
    "Spin flax",
    "Potters wheel",
    "Fire pottery",
    "Glass-blow",
    "Mold",
    "Shape",
    "Sculpt",
    "Carve",
    "Weld",
    "Measure",
    "Trim",
    "Varnish",
    "Lacquer",
    "Assemble",
    "Disassemble",
    "Bond",
    "Adhere",
    "Glue",
    // Fletching
    "Fletch",
    "Feather",
    "String bow",
    "Tip",
    "Bolt",
    "Cut log",
    "Shape",
    "Carve",
    "Shaft",
    "Vial",
    "Poison tip",
    "Enchant bolt",
    "Draw bow",
    "Nock arrow",
    "Cut feathers",
    "Split shafts",
    "Prepare wood",
    "Season wood",
    "Apply bowstring",
    "Tension test",
    "Balance arrow",
    "Trim fletching",
    "Add weight",
    "Craft dart",
    "Craft throwing knife",
    "Craft javelin",
    "Attach feathers",
    "Split wood",
    "Straighten shaft",
    "Apply resin",
    "Seal wood",
    "Prepare tip",
    "Sharpen tip",
];
const characterActions = [
    // Basic NPC interactions
    "Attack",
    "Talk-to",
    "Trade",
    "Pickpocket",
    "Examine",
    "Collect",
    "Pay",
    "Heal",
    "Cure",
    // Thieving
    "Steal-from",
    "Knock-out",
    "Lure",
    // Slayer
    "Get-task",
    "Skip-task",
    "Block-task",
    "Get-rewards",
    "Check-count",
    // Combat
    "Weaken",
    "Stun",
    "Bash",
    "Slay",
    "Intimidate",
    // Magic
    "Teleother",
    "Bones to bananas",
    "Enchant",
    "Stun",
    "Alch",
    // Quest specific
    "Rescue",
    "Free",
    "Escort",
    "Distract",
    "Signal",
];
const playerActions = [
    "Trade with",
    "Follow",
    "Report",
    "Challenge",
    "Attack",
    "Invite",
    "Lookup",
    // PvP
    "Duel",
    "Skull-trick",
    "Freeze",
    "TB", // Teleblock
    "Spec", // Special attack
    // Group activities
    "Kick",
    "Promote",
    "Demote",
    "Share-loot",
    "Request-assist",
    // Communication
    "Message",
    "Emote-to",
    "Show-stats",
    "Show-items",
    "Show-kc", // Kill count
];
const interfaceActions = [
    "Walk here",
    "Cancel",
    "Continue",
    "Select",
    "Value",
    "Buy",
    "Sell",
    "Accept",
    "Decline",
    "Offer",
    "Exchange all",
    // Bank interface
    "Withdraw-all",
    "Withdraw-x",
    "Deposit-all",
    "Deposit-x",
    "Placeholder",
    // Combat interface
    "Auto-retaliate",
    "Special-attack",
    "Toggle-run",
    "Toggle-style",
    "Toggle-prayer",
    // Settings
    "Configure",
    "Toggle",
    "Adjust",
    "Enable",
    "Disable",
    // Dialogue
    "Option-1",
    "Option-2",
    "Option-3",
    "Option-4",
    "Option-5",
    // Grand Exchange
    "Create-offer",
    "Abort-offer",
    "Collect",
    "Collect-to-bank",
    "View-history",
];
/**
 * Determine target type based on action and other context
 * @param action - The action performed
 * @param originalTarget - The original target text
 * @param hasLevel - Whether the target includes level information
 * @returns The determined target type
 */
const determineTargetType = (action, originalTarget, hasLevel) => {
    // First check based on level presence
    if (originalTarget.includes("(level")) {
        return "character";
    }
    let targetType = "unknown";
    // Determine by action
    if (characterActions.includes(action)) {
        targetType = "character";
    }
    else if (itemActions.includes(action)) {
        targetType = "item";
    }
    else if (objectActions.includes(action)) {
        targetType = "object";
    }
    else if (playerActions.includes(action)) {
        targetType = "player";
    }
    else if (interfaceActions.includes(action)) {
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
exports.determineTargetType = determineTargetType;
/**
 * Process MENU_CLICK events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
const batchProcessMenuClicks = async (session, events, txnUuid, dataUuid, account, playerId) => {
    // Process events to extract actual character names and categorize by target type
    const processedEvents = events.map((event) => {
        // Ensure action is never null
        const action = event.details.action || "Unknown";
        let hasLevel = event.details.target.includes("(level") ||
            event.details.target.includes("</col>");
        let targetType = (0, exports.determineTargetType)(action, event.details.target, hasLevel);
        // Clean target name here to ensure consistent formatting
        let cleanTarget = event.details.target
            .replace(/<\/col>$/, "")
            .replace(/\(level.*/, "")
            .trim();
        return {
            ...event,
            targetType,
            cleanTarget,
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
        const itemDiagnostic = await session.executeRead((tx) => tx.run(`
        MATCH (i:Item)
        RETURN i.name AS name, count(i) AS count
        ORDER BY count DESC
        LIMIT 10
      `));
        console.log("Current Item counts before processing:");
        itemDiagnostic.records.forEach((record) => {
            console.log(`${record.get("name")}: ${record.get("count")}`);
        });
    }
    catch (err) {
        console.error("Error in diagnostic query:", err);
    }
    return await session.executeWrite(async (tx) => {
        // Create all menu click events first
        await tx.run(`
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
      `, params);
        // Process item targets - using a more robust approach
        await tx.run(`
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

// Basic item interactions
FOREACH(ignoreMe IN CASE WHEN action = "Take" THEN [1] ELSE [] END |
  CREATE (e)-[:COLLECTED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Bury" THEN [1] ELSE [] END |
  CREATE (e)-[:BURIED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Drop" THEN [1] ELSE [] END |
  CREATE (e)-[:DROPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Use" THEN [1] ELSE [] END |
  CREATE (e)-[:USED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END |
  CREATE (e)-[:EXAMINED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Eat" THEN [1] ELSE [] END |
  CREATE (e)-[:CONSUMED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Drink" THEN [1] ELSE [] END |
  CREATE (e)-[:CONSUMED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Equip" THEN [1] ELSE [] END |
  CREATE (e)-[:EQUIPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Wear" THEN [1] ELSE [] END |
  CREATE (e)-[:EQUIPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Wield" THEN [1] ELSE [] END |
  CREATE (e)-[:EQUIPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Unequip" THEN [1] ELSE [] END |
  CREATE (e)-[:UNEQUIPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Remove" THEN [1] ELSE [] END |
  CREATE (e)-[:UNEQUIPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Empty" THEN [1] ELSE [] END |
  CREATE (e)-[:EMPTIED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Fill" THEN [1] ELSE [] END |
  CREATE (e)-[:FILLED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Close" THEN [1] ELSE [] END |
  CREATE (e)-[:CLOSED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Read" THEN [1] ELSE [] END |
  CREATE (e)-[:READ]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Rub" THEN [1] ELSE [] END |
  CREATE (e)-[:RUBBED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Open" THEN [1] ELSE [] END |
  CREATE (e)-[:OPENED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Cast" THEN [1] ELSE [] END |
  CREATE (e)-[:CAST]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Break" THEN [1] ELSE [] END |
  CREATE (e)-[:BROKE]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Destroy" THEN [1] ELSE [] END |
  CREATE (e)-[:DESTROYED]->(item))

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

FOREACH(ignoreMe IN CASE WHEN action = "Combine" THEN [1] ELSE [] END |
  CREATE (e)-[:COMBINED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Check" THEN [1] ELSE [] END |
  CREATE (e)-[:CHECKED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Dismantle" THEN [1] ELSE [] END |
  CREATE (e)-[:DISMANTLED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Store" THEN [1] ELSE [] END |
  CREATE (e)-[:STORED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Withdraw" THEN [1] ELSE [] END |
  CREATE (e)-[:WITHDREW]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Note" THEN [1] ELSE [] END |
  CREATE (e)-[:NOTED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Un-note" THEN [1] ELSE [] END |
  CREATE (e)-[:UNNOTED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Claim" THEN [1] ELSE [] END |
  CREATE (e)-[:CLAIMED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Inspect" THEN [1] ELSE [] END |
  CREATE (e)-[:INSPECTED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Operate" THEN [1] ELSE [] END |
  CREATE (e)-[:OPERATED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Toggle" THEN [1] ELSE [] END |
  CREATE (e)-[:TOGGLED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Configure" THEN [1] ELSE [] END |
  CREATE (e)-[:CONFIGURED]->(item))

// Magic
FOREACH(ignoreMe IN CASE WHEN action = "Alchemy" OR action = "High Alchemy" OR action = "High-Alchemy" THEN [1] ELSE [] END |
  CREATE (e)-[:ALCHED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Enchant" THEN [1] ELSE [] END |
  CREATE (e)-[:ENCHANTED]->(item))

// Herblore
FOREACH(ignoreMe IN CASE WHEN action = "Identify" THEN [1] ELSE [] END |
  CREATE (e)-[:IDENTIFIED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Mix" THEN [1] ELSE [] END |
  CREATE (e)-[:MIXED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Crush" THEN [1] ELSE [] END |
  CREATE (e)-[:CRUSHED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Grind" THEN [1] ELSE [] END |
  CREATE (e)-[:GROUND]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Dose" THEN [1] ELSE [] END |
  CREATE (e)-[:DOSED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Decant" THEN [1] ELSE [] END |
  CREATE (e)-[:DECANTED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Clean herb" THEN [1] ELSE [] END |
  CREATE (e)-[:CLEANED_HERB]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Make unf" THEN [1] ELSE [] END |
  CREATE (e)-[:MADE_UNF]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Make tar" THEN [1] ELSE [] END |
  CREATE (e)-[:MADE_TAR]->(item))

// Cooking
FOREACH(ignoreMe IN CASE WHEN action = "Cook" THEN [1] ELSE [] END |
  CREATE (e)-[:COOKED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Bake" THEN [1] ELSE [] END |
  CREATE (e)-[:BAKED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Brew" THEN [1] ELSE [] END |
  CREATE (e)-[:BREWED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Ferment" THEN [1] ELSE [] END |
  CREATE (e)-[:FERMENTED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Fry" THEN [1] ELSE [] END |
  CREATE (e)-[:FRIED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Slice" THEN [1] ELSE [] END |
  CREATE (e)-[:SLICED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Dice" THEN [1] ELSE [] END |
  CREATE (e)-[:DICED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Churn" THEN [1] ELSE [] END |
  CREATE (e)-[:CHURNED]->(item))

// Crafting
FOREACH(ignoreMe IN CASE WHEN action = "String" THEN [1] ELSE [] END |
  CREATE (e)-[:STRUNG]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Cut" THEN [1] ELSE [] END |
  CREATE (e)-[:CUT]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Polish" THEN [1] ELSE [] END |
  CREATE (e)-[:POLISHED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Thread" THEN [1] ELSE [] END |
  CREATE (e)-[:THREADED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Attach" THEN [1] ELSE [] END |
  CREATE (e)-[:ATTACHED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Stamp" THEN [1] ELSE [] END |
  CREATE (e)-[:STAMPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Engrave" THEN [1] ELSE [] END |
  CREATE (e)-[:ENGRAVED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Chisel" THEN [1] ELSE [] END |
  CREATE (e)-[:CHISELED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Glaze" THEN [1] ELSE [] END |
  CREATE (e)-[:GLAZED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Dye" THEN [1] ELSE [] END |
  CREATE (e)-[:DYED]->(item))

// Fletching
FOREACH(ignoreMe IN CASE WHEN action = "Fletch" THEN [1] ELSE [] END |
  CREATE (e)-[:FLETCHED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Feather" THEN [1] ELSE [] END |
  CREATE (e)-[:FEATHERED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "String bow" THEN [1] ELSE [] END |
  CREATE (e)-[:STRUNG_BOW]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Tip" THEN [1] ELSE [] END |
  CREATE (e)-[:TIPPED]->(item))

FOREACH(ignoreMe IN CASE WHEN action = "Bolt" THEN [1] ELSE [] END |
  CREATE (e)-[:BOLTED]->(item))

// Catch-all for any item actions not explicitly defined
FOREACH(ignoreMe IN CASE WHEN NOT action IN [
  "Take", "Bury", "Drop", "Use", "Examine", "Eat", "Drink", "Equip", "Wear", "Wield", 
  "Unequip", "Remove", "Empty", "Fill", "Close", "Read", "Rub", "Open", "Cast", "Break", 
  "Destroy", "Clean", "Bank", "Sell", "Trade", "Split", "Combine", "Check", "Dismantle", 
  "Store", "Withdraw", "Note", "Un-note", "Claim", "Inspect", "Operate", "Toggle", "Configure",
  "Alchemy", "High Alchemy", "High-Alchemy", "Enchant", "Identify", "Mix", "Crush", "Grind", 
  "Dose", "Decant", "Clean herb", "Make unf", "Make tar", "Cook", "Bake", "Brew", "Ferment", 
  "Fry", "Slice", "Dice", "Churn", "String", "Cut", "Polish", "Thread", "Attach", "Stamp", 
  "Engrave", "Chisel", "Glaze", "Dye", "Fletch", "Feather", "String bow", "Tip", "Bolt"
] THEN [1] ELSE [] END |
  CREATE (e)-[:INTERACTED_WITH]->(item))
      `, params);
        // Process character targets in the same pattern
        await tx.run(`
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

// Basic NPC interactions
FOREACH(ignoreMe IN CASE WHEN action = "Attack" THEN [1] ELSE [] END | 
  CREATE (e)-[:ATTACKED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Talk-to" THEN [1] ELSE [] END | 
  CREATE (e)-[:TALKED_TO]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Trade" THEN [1] ELSE [] END | 
  CREATE (e)-[:TRADED_WITH]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Pickpocket" THEN [1] ELSE [] END | 
  CREATE (e)-[:PICKPOCKETED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END | 
  CREATE (e)-[:EXAMINED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Collect" THEN [1] ELSE [] END | 
  CREATE (e)-[:COLLECTED_FROM]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Pay" THEN [1] ELSE [] END | 
  CREATE (e)-[:PAID]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Heal" THEN [1] ELSE [] END | 
  CREATE (e)-[:HEALED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Cure" THEN [1] ELSE [] END | 
  CREATE (e)-[:CURED]->(character))

// Thieving
FOREACH(ignoreMe IN CASE WHEN action = "Steal-from" THEN [1] ELSE [] END | 
  CREATE (e)-[:STOLE_FROM]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Knock-out" THEN [1] ELSE [] END | 
  CREATE (e)-[:KNOCKED_OUT]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Lure" THEN [1] ELSE [] END | 
  CREATE (e)-[:LURED]->(character))

// Slayer
FOREACH(ignoreMe IN CASE WHEN action = "Get-task" THEN [1] ELSE [] END | 
  CREATE (e)-[:GOT_TASK_FROM]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Skip-task" THEN [1] ELSE [] END | 
  CREATE (e)-[:SKIPPED_TASK_WITH]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Block-task" THEN [1] ELSE [] END | 
  CREATE (e)-[:BLOCKED_TASK_WITH]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Get-rewards" THEN [1] ELSE [] END | 
  CREATE (e)-[:GOT_REWARDS_FROM]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Check-count" THEN [1] ELSE [] END | 
  CREATE (e)-[:CHECKED_COUNT_WITH]->(character))

// Combat
FOREACH(ignoreMe IN CASE WHEN action = "Weaken" THEN [1] ELSE [] END | 
  CREATE (e)-[:WEAKENED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Stun" THEN [1] ELSE [] END | 
  CREATE (e)-[:STUNNED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Bash" THEN [1] ELSE [] END | 
  CREATE (e)-[:BASHED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Slay" THEN [1] ELSE [] END | 
  CREATE (e)-[:SLAYED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Intimidate" THEN [1] ELSE [] END | 
  CREATE (e)-[:INTIMIDATED]->(character))

// Magic
FOREACH(ignoreMe IN CASE WHEN action = "Teleother" THEN [1] ELSE [] END | 
  CREATE (e)-[:TELEOTHERED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Bones to bananas" THEN [1] ELSE [] END | 
  CREATE (e)-[:BONES_TO_BANANAS]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Enchant" THEN [1] ELSE [] END | 
  CREATE (e)-[:ENCHANTED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Alch" THEN [1] ELSE [] END | 
  CREATE (e)-[:ALCHED]->(character))

// Quest specific
FOREACH(ignoreMe IN CASE WHEN action = "Rescue" THEN [1] ELSE [] END | 
  CREATE (e)-[:RESCUED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Free" THEN [1] ELSE [] END | 
  CREATE (e)-[:FREED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Escort" THEN [1] ELSE [] END | 
  CREATE (e)-[:ESCORTED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Distract" THEN [1] ELSE [] END | 
  CREATE (e)-[:DISTRACTED]->(character))
  
FOREACH(ignoreMe IN CASE WHEN action = "Signal" THEN [1] ELSE [] END | 
  CREATE (e)-[:SIGNALED]->(character))

// Catch-all for any actions not explicitly defined
FOREACH(ignoreMe IN CASE WHEN NOT action IN [
  "Attack", "Talk-to", "Trade", "Pickpocket", "Examine", "Collect", "Pay", "Heal", "Cure",
  "Steal-from", "Knock-out", "Lure", 
  "Get-task", "Skip-task", "Block-task", "Get-rewards", "Check-count",
  "Weaken", "Stun", "Bash", "Slay", "Intimidate",
  "Teleother", "Bones to bananas", "Enchant", "Alch",
  "Rescue", "Free", "Escort", "Distract", "Signal"
] THEN [1] ELSE [] END | 
  CREATE (e)-[:INTERACTED_WITH]->(character))
      `, params);
        // Process object targets in the same pattern
        await tx.run(`
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
 
FOREACH(ignoreMe IN CASE WHEN action = "Collect-ore" THEN [1] ELSE [] END |
  CREATE (e)-[:COLLECTED_ORE]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Break" THEN [1] ELSE [] END |
  CREATE (e)-[:BROKE]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Chip" THEN [1] ELSE [] END |
  CREATE (e)-[:CHIPPED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Blast" THEN [1] ELSE [] END |
  CREATE (e)-[:BLASTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Crush rock" THEN [1] ELSE [] END |
  CREATE (e)-[:CRUSHED_ROCK]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Collect gems" THEN [1] ELSE [] END |
  CREATE (e)-[:COLLECTED_GEMS]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Reinforce" THEN [1] ELSE [] END |
  CREATE (e)-[:REINFORCED]->(object))

// Woodcutting
FOREACH(ignoreMe IN CASE WHEN action = "Chop down" THEN [1] ELSE [] END |
  CREATE (e)-[:CHOPPED_DOWN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Chop" THEN [1] ELSE [] END |
  CREATE (e)-[:CHOPPED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Cut down" THEN [1] ELSE [] END |
  CREATE (e)-[:CUT_DOWN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Fell" THEN [1] ELSE [] END |
  CREATE (e)-[:FELLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Collect logs" THEN [1] ELSE [] END |
  CREATE (e)-[:COLLECTED_LOGS]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Saw" THEN [1] ELSE [] END |
  CREATE (e)-[:SAWED]->(object))

// Fishing
FOREACH(ignoreMe IN CASE WHEN action = "Fish" THEN [1] ELSE [] END |
  CREATE (e)-[:FISHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Harpoon" THEN [1] ELSE [] END |
  CREATE (e)-[:HARPOONED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Net" THEN [1] ELSE [] END |
  CREATE (e)-[:NETTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Bait" THEN [1] ELSE [] END |
  CREATE (e)-[:BAITED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Lure" THEN [1] ELSE [] END |
  CREATE (e)-[:LURED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Cage" THEN [1] ELSE [] END |
  CREATE (e)-[:CAGED]->(object))

// Hunter
FOREACH(ignoreMe IN CASE WHEN action = "Trap" THEN [1] ELSE [] END |
  CREATE (e)-[:TRAPPED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Check-trap" THEN [1] ELSE [] END |
  CREATE (e)-[:CHECKED_TRAP]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Lay-trap" THEN [1] ELSE [] END |
  CREATE (e)-[:LAID_TRAP]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Dismantle-trap" THEN [1] ELSE [] END |
  CREATE (e)-[:DISMANTLED_TRAP]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Track" THEN [1] ELSE [] END |
  CREATE (e)-[:TRACKED]->(object))

// Crafting
FOREACH(ignoreMe IN CASE WHEN action = "Craft" THEN [1] ELSE [] END |
  CREATE (e)-[:CRAFTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Spin" THEN [1] ELSE [] END |
  CREATE (e)-[:SPUN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Weave" THEN [1] ELSE [] END |
  CREATE (e)-[:WEAVED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Mould" THEN [1] ELSE [] END |
  CREATE (e)-[:MOULDED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Glassblowing" THEN [1] ELSE [] END |
  CREATE (e)-[:GLASSBLOWED]->(object))

// Smithing
FOREACH(ignoreMe IN CASE WHEN action = "Smith" THEN [1] ELSE [] END |
  CREATE (e)-[:SMITHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Smelt" THEN [1] ELSE [] END |
  CREATE (e)-[:SMELTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Hammer" THEN [1] ELSE [] END |
  CREATE (e)-[:HAMMERED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Forge" THEN [1] ELSE [] END |
  CREATE (e)-[:FORGED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Plate" THEN [1] ELSE [] END |
  CREATE (e)-[:PLATED]->(object))

// Cooking
FOREACH(ignoreMe IN CASE WHEN action = "Use-stove" THEN [1] ELSE [] END |
  CREATE (e)-[:USED_STOVE]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Use-range" THEN [1] ELSE [] END |
  CREATE (e)-[:USED_RANGE]->(object))

// Farming
FOREACH(ignoreMe IN CASE WHEN action = "Plant" THEN [1] ELSE [] END |
  CREATE (e)-[:PLANTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Harvest" THEN [1] ELSE [] END |
  CREATE (e)-[:HARVESTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Rake" THEN [1] ELSE [] END |
  CREATE (e)-[:RAKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Compost" THEN [1] ELSE [] END |
  CREATE (e)-[:COMPOSTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Cure-plant" THEN [1] ELSE [] END |
  CREATE (e)-[:CURED_PLANT]->(object))

// Construction
FOREACH(ignoreMe IN CASE WHEN action = "Build" THEN [1] ELSE [] END |
  CREATE (e)-[:BUILT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Remove" THEN [1] ELSE [] END |
  CREATE (e)-[:REMOVED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Move" THEN [1] ELSE [] END |
  CREATE (e)-[:MOVED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Rotate" THEN [1] ELSE [] END |
  CREATE (e)-[:ROTATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Customize" THEN [1] ELSE [] END |
  CREATE (e)-[:CUSTOMIZED]->(object))

// Prayer
FOREACH(ignoreMe IN CASE WHEN action = "Pray" THEN [1] ELSE [] END |
  CREATE (e)-[:PRAYED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Offer" THEN [1] ELSE [] END |
  CREATE (e)-[:OFFERED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Sacrifice" THEN [1] ELSE [] END |
  CREATE (e)-[:SACRIFICED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Worship" THEN [1] ELSE [] END |
  CREATE (e)-[:WORSHIPPED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Cleanse" THEN [1] ELSE [] END |
  CREATE (e)-[:CLEANSED]->(object))

// Agility
FOREACH(ignoreMe IN CASE WHEN action = "Climb" THEN [1] ELSE [] END |
  CREATE (e)-[:CLIMBED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Cross" THEN [1] ELSE [] END |
  CREATE (e)-[:CROSSED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Balance" THEN [1] ELSE [] END |
  CREATE (e)-[:BALANCED_ON]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Jump" THEN [1] ELSE [] END |
  CREATE (e)-[:JUMPED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Swing" THEN [1] ELSE [] END |
  CREATE (e)-[:SWUNG_ON]->(object))

// Runecraft
FOREACH(ignoreMe IN CASE WHEN action = "Craft-rune" THEN [1] ELSE [] END |
  CREATE (e)-[:CRAFTED_RUNE]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Bind" THEN [1] ELSE [] END |
  CREATE (e)-[:BOUND]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Infuse" THEN [1] ELSE [] END |
  CREATE (e)-[:INFUSED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Talisman" THEN [1] ELSE [] END |
  CREATE (e)-[:USED_TALISMAN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Imbue" THEN [1] ELSE [] END |
  CREATE (e)-[:IMBUED]->(object))

// Magic
FOREACH(ignoreMe IN CASE WHEN action = "Cast-on" THEN [1] ELSE [] END |
  CREATE (e)-[:CAST_ON]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Channel" THEN [1] ELSE [] END |
  CREATE (e)-[:CHANNELED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Activate" THEN [1] ELSE [] END |
  CREATE (e)-[:ACTIVATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Teleport-to" THEN [1] ELSE [] END |
  CREATE (e)-[:TELEPORTED_TO]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Charge" THEN [1] ELSE [] END |
  CREATE (e)-[:CHARGED]->(object))

// Firemaking
FOREACH(ignoreMe IN CASE WHEN action = "Light-fire" THEN [1] ELSE [] END |
  CREATE (e)-[:LIT_FIRE]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Light" THEN [1] ELSE [] END |
  CREATE (e)-[:LIT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Add-logs" THEN [1] ELSE [] END |
  CREATE (e)-[:ADDED_LOGS]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Extinguish" THEN [1] ELSE [] END |
  CREATE (e)-[:EXTINGUISHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Stoke" THEN [1] ELSE [] END |
  CREATE (e)-[:STOKED]->(object))

// Thieving
FOREACH(ignoreMe IN CASE WHEN action = "Steal from" THEN [1] ELSE [] END |
  CREATE (e)-[:STOLE_FROM]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Pickpocket" THEN [1] ELSE [] END |
  CREATE (e)-[:PICKPOCKETED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Crack" THEN [1] ELSE [] END |
  CREATE (e)-[:CRACKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Lockpick" THEN [1] ELSE [] END |
  CREATE (e)-[:LOCKPICKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Disable trap" THEN [1] ELSE [] END |
  CREATE (e)-[:DISABLED_TRAP]->(object))

// Combat/Attack/Strength/Defense
FOREACH(ignoreMe IN CASE WHEN action = "Attack" THEN [1] ELSE [] END |
  CREATE (e)-[:ATTACKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Defend" THEN [1] ELSE [] END |
  CREATE (e)-[:DEFENDED_AGAINST]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Block" THEN [1] ELSE [] END |
  CREATE (e)-[:BLOCKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Parry" THEN [1] ELSE [] END |
  CREATE (e)-[:PARRIED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Counter" THEN [1] ELSE [] END |
  CREATE (e)-[:COUNTERED]->(object))

// General object interactions
FOREACH(ignoreMe IN CASE WHEN action = "Enter" THEN [1] ELSE [] END |
  CREATE (e)-[:ENTERED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Open" THEN [1] ELSE [] END |
  CREATE (e)-[:OPENED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Close" THEN [1] ELSE [] END |
  CREATE (e)-[:CLOSED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Catch" THEN [1] ELSE [] END |
  CREATE (e)-[:CAUGHT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Examine" THEN [1] ELSE [] END |
  CREATE (e)-[:EXAMINED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Search" THEN [1] ELSE [] END |
  CREATE (e)-[:SEARCHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Investigate" THEN [1] ELSE [] END |
  CREATE (e)-[:INVESTIGATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Deposit" THEN [1] ELSE [] END |
  CREATE (e)-[:DEPOSITED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Withdraw" THEN [1] ELSE [] END |
  CREATE (e)-[:WITHDREW_FROM]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Repair" THEN [1] ELSE [] END |
  CREATE (e)-[:REPAIRED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Fix" THEN [1] ELSE [] END |
  CREATE (e)-[:FIXED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Restore" THEN [1] ELSE [] END |
  CREATE (e)-[:RESTORED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Fill" THEN [1] ELSE [] END |
  CREATE (e)-[:FILLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Empty" THEN [1] ELSE [] END |
  CREATE (e)-[:EMPTIED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Pick" THEN [1] ELSE [] END |
  CREATE (e)-[:PICKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Read" THEN [1] ELSE [] END |
  CREATE (e)-[:READ]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Push" THEN [1] ELSE [] END |
  CREATE (e)-[:PUSHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Use" THEN [1] ELSE [] END |
  CREATE (e)-[:USED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Bank" THEN [1] ELSE [] END |
  CREATE (e)-[:BANKED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Exchange" THEN [1] ELSE [] END |
  CREATE (e)-[:EXCHANGED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Burn" THEN [1] ELSE [] END |
  CREATE (e)-[:BURNED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Pull" THEN [1] ELSE [] END |
  CREATE (e)-[:PULLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Turn" THEN [1] ELSE [] END |
  CREATE (e)-[:TURNED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Drink from" THEN [1] ELSE [] END |
  CREATE (e)-[:DRANK_FROM]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Roll" THEN [1] ELSE [] END |
  CREATE (e)-[:ROLLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Shake" THEN [1] ELSE [] END |
  CREATE (e)-[:SHOOK]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Operate" THEN [1] ELSE [] END |
  CREATE (e)-[:OPERATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Manipulate" THEN [1] ELSE [] END |
  CREATE (e)-[:MANIPULATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Combine with" THEN [1] ELSE [] END |
  CREATE (e)-[:COMBINED_WITH]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Listen to" THEN [1] ELSE [] END |
  CREATE (e)-[:LISTENED_TO]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Peek" THEN [1] ELSE [] END |
  CREATE (e)-[:PEEKED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Look through" THEN [1] ELSE [] END |
  CREATE (e)-[:LOOKED_THROUGH]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Kick" THEN [1] ELSE [] END |
  CREATE (e)-[:KICKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Adjust" THEN [1] ELSE [] END |
  CREATE (e)-[:ADJUSTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Tune" THEN [1] ELSE [] END |
  CREATE (e)-[:TUNED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Pry" THEN [1] ELSE [] END |
  CREATE (e)-[:PRIED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Steal from" THEN [1] ELSE [] END |
  CREATE (e)-[:STOLE_FROM]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Deactivate" THEN [1] ELSE [] END |
  CREATE (e)-[:DEACTIVATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Flip" THEN [1] ELSE [] END |
  CREATE (e)-[:FLIPPED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Touch" THEN [1] ELSE [] END |
  CREATE (e)-[:TOUCHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Clean" THEN [1] ELSE [] END |
  CREATE (e)-[:CLEANED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Wash" THEN [1] ELSE [] END |
  CREATE (e)-[:WASHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Dry" THEN [1] ELSE [] END |
  CREATE (e)-[:DRIED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Scrub" THEN [1] ELSE [] END |
  CREATE (e)-[:SCRUBBED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Polish" THEN [1] ELSE [] END |
  CREATE (e)-[:POLISHED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Ignite" THEN [1] ELSE [] END |
  CREATE (e)-[:IGNITED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Douse" THEN [1] ELSE [] END |
  CREATE (e)-[:DOUSED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Connect" THEN [1] ELSE [] END |
  CREATE (e)-[:CONNECTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Disconnect" THEN [1] ELSE [] END |
  CREATE (e)-[:DISCONNECTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Insert" THEN [1] ELSE [] END |
  CREATE (e)-[:INSERTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Remove from" THEN [1] ELSE [] END |
  CREATE (e)-[:REMOVED_FROM]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Bolt" THEN [1] ELSE [] END |
  CREATE (e)-[:BOLTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Screw" THEN [1] ELSE [] END |
  CREATE (e)-[:SCREWED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Nail" THEN [1] ELSE [] END |
  CREATE (e)-[:NAILED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Wedge" THEN [1] ELSE [] END |
  CREATE (e)-[:WEDGED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Feed" THEN [1] ELSE [] END |
  CREATE (e)-[:FED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Board" THEN [1] ELSE [] END |
  CREATE (e)-[:BOARDED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Disembark" THEN [1] ELSE [] END |
  CREATE (e)-[:DISEMBARKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Tether" THEN [1] ELSE [] END |
  CREATE (e)-[:TETHERED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Untether" THEN [1] ELSE [] END |
  CREATE (e)-[:UNTETHERED]->(object))

// Additional General Interactions
FOREACH(ignoreMe IN CASE WHEN action = "Unlock" THEN [1] ELSE [] END |
  CREATE (e)-[:UNLOCKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Force" THEN [1] ELSE [] END |
  CREATE (e)-[:FORCED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Pick-lock" THEN [1] ELSE [] END |
  CREATE (e)-[:PICKED_LOCK]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Disarm" THEN [1] ELSE [] END |
  CREATE (e)-[:DISARMED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Clear" THEN [1] ELSE [] END |
  CREATE (e)-[:CLEARED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Detonate" THEN [1] ELSE [] END |
  CREATE (e)-[:DETONATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Sabotage" THEN [1] ELSE [] END |
  CREATE (e)-[:SABOTAGED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Disable" THEN [1] ELSE [] END |
  CREATE (e)-[:DISABLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Enable" THEN [1] ELSE [] END |
  CREATE (e)-[:ENABLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Reset" THEN [1] ELSE [] END |
  CREATE (e)-[:RESET]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Override" THEN [1] ELSE [] END |
  CREATE (e)-[:OVERRODE]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Hack" THEN [1] ELSE [] END |
  CREATE (e)-[:HACKED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Configure" THEN [1] ELSE [] END |
  CREATE (e)-[:CONFIGURED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Set up" THEN [1] ELSE [] END |
  CREATE (e)-[:SET_UP]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Take down" THEN [1] ELSE [] END |
  CREATE (e)-[:TOOK_DOWN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Assemble" THEN [1] ELSE [] END |
  CREATE (e)-[:ASSEMBLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Disassemble" THEN [1] ELSE [] END |
  CREATE (e)-[:DISASSEMBLED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Mount" THEN [1] ELSE [] END |
  CREATE (e)-[:MOUNTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Dismount" THEN [1] ELSE [] END |
  CREATE (e)-[:DISMOUNTED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Flip over" THEN [1] ELSE [] END |
  CREATE (e)-[:FLIPPED_OVER]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Turn upside down" THEN [1] ELSE [] END |
  CREATE (e)-[:TURNED_UPSIDE_DOWN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Face" THEN [1] ELSE [] END |
  CREATE (e)-[:FACED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Point at" THEN [1] ELSE [] END |
  CREATE (e)-[:POINTED_AT]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Direct toward" THEN [1] ELSE [] END |
  CREATE (e)-[:DIRECTED_TOWARD]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Align with" THEN [1] ELSE [] END |
  CREATE (e)-[:ALIGNED_WITH]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Center on" THEN [1] ELSE [] END |
  CREATE (e)-[:CENTERED_ON]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Adjust position" THEN [1] ELSE [] END |
  CREATE (e)-[:ADJUSTED_POSITION]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Fine-tune" THEN [1] ELSE [] END |
  CREATE (e)-[:FINE_TUNED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Calibrate" THEN [1] ELSE [] END |
  CREATE (e)-[:CALIBRATED]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Zero in" THEN [1] ELSE [] END |
  CREATE (e)-[:ZEROED_IN]->(object))
 
FOREACH(ignoreMe IN CASE WHEN action = "Target lock" THEN [1] ELSE [] END |
  CREATE (e)-[:TARGET_LOCKED]->(object))

// Catch-all for any actions not explicitly defined
FOREACH(ignoreMe IN CASE WHEN NOT action IN [
  // Mining and Gathering
  "Mine", "Prospect", "Collect-ore", "Break", "Chip", "Blast", "Crush rock", "Collect gems", "Reinforce",
  // Woodcutting
  "Chop down", "Chop", "Cut down", "Fell", "Collect logs", "Saw",
  // Fishing
  "Fish", "Harpoon", "Net", "Bait", "Lure", "Cage", "Trawl", "Spear", "Fly fish", "Bait pot", 
  "Check net", "Collect", "Haul in", "Deposit catch", "Clean catch",
  // Hunter
  "Trap", "Check-trap", "Lay-trap", "Dismantle-trap", "Track", "Flush", "Call", "Catch impling",
  "Set snare", "Set pitfall", "Set deadfall", "Set box trap", "Release", "Collect furs", "Collect feathers",
  // Crafting
  "Craft", "Spin", "Weave", "Mould", "Glassblowing", "Silver-craft", "Chisel", "Etch", "Polish", 
  "Thread", "Needle", "Loom", "Tan hide", "Shape glass", "Fire pottery", "Glaze", "Dye",
  // Smithing
  "Smith", "Smelt", "Hammer", "Forge", "Plate", "Refine", "Heat", "Quench", "Anneal", "Temper", 
  "Cast metal", "Fold metal", "Rivet", "Weld", "Sharpen", "Grind",
  // Cooking
  "Use-stove", "Use-range",
  // Farming
  "Plant", "Harvest", "Rake", "Compost", "Cure-plant", "Water", "Fertilize", "Weed", "Prune", 
  "Dig", "Sow seeds", "Transplant", "Pollinate", "Graft", "Scarecrow", "Inspect", "Stake", 
  "Support", "Irrigate", "Strip-bark", "Check-health",
  // Construction
  "Build", "Remove", "Move", "Rotate", "Customize", "Plan", "Decorate", "Renovate", "Expand", 
  "Reinforce", "Paint", "Wallpaper", "Replace", "Upgrade", "Repair", "Demolish", "Measure", 
  "Design", "Blueprint",
  // Prayer
  "Pray", "Offer", "Sacrifice", "Worship", "Cleanse", "Bless", "Consecrate", "Meditate", "Chant", 
  "Ritual", "Anoint", "Sanctify", "Bury bones", "Scatter ashes", "Commune", "Recite", "Hymn", 
  "Invocation", "Kneel",
  // Agility
  "Climb", "Cross", "Balance", "Jump", "Swing", "Squeeze-through", "Vault", "Leap", "Hurdle", 
  "Navigate", "Scale", "Descend", "Grip", "Slide", "Dive", "Roll", "Tumble", "Shimmy", "Hang", "Scramble",
  // Runecraft
  "Craft-rune", "Bind", "Infuse", "Talisman", "Imbue", "Channel", "Focus", "Concentrate", "Align", 
  "Draw power", "Harness", "Extract energy", "Condense", "Purify", "Filter", "Distill", "Divide",
  // Magic
  "Cast-on", "Channel", "Activate", "Teleport-to", "Charge", "Spellbook", "Focus", "Attune", "Absorb", 
  "Harvest energy", "Convert energy", "Store energy", "Release energy", "Bind", "Curse", "Hex", 
  "Dispel", "Counterspell",
  // Firemaking
  "Light-fire", "Light", "Add-logs", "Extinguish", "Stoke", "Feed fire", "Bank cinders", "Light beacon", 
  "Signal", "Build pyre", "Create bonfire", "Warm hands", "Arrange logs", "Prepare kindling", "Light kindling", 
  "Light torch", "Light lantern", "Fill lantern", "Clean lantern", "Adjust flame",
  // Thieving
  "Steal from", "Pickpocket", "Crack", "Lockpick", "Disable trap", "Detect trap", "Deactivate", "Hide", 
  "Sneak", "Distract", "Peek", "Scout", "Case", "Mark", "Break in", "Pick safe", "Crack safe", "Bypass", 
  "Duplicate key", "Force", "Tamper", "Pilfer", "Lift", "Palm", "Switch", "Con",
  // Combat
  "Attack", "Defend", "Block", "Parry", "Counter", "Strike", "Slash", "Stab", "Crush", "Bash", "Slam", 
  "Pound", "Train on", "Spar with", "Dummy", "Practice on", "Dodge", "Shield", "Target", "Equip rack",
  // General object interactions
  "Enter", "Open", "Close", "Catch", "Examine", "Search", "Investigate", "Deposit", "Withdraw", 
  "Repair", "Fix", "Restore", "Fill", "Empty", "Pick", "Read", "Push", "Use", "Bank", "Exchange", 
  "Burn", "Pull", "Turn", "Drink from", "Roll", "Shake", "Operate", "Manipulate", "Combine with", 
  "Listen to", "Look through", "Kick", "Adjust", "Tune", "Pry", "Touch", "Clean", "Wash", "Dry", "Scrub", 
  "Ignite", "Douse", "Connect", "Disconnect", "Insert", "Remove from", "Bolt", "Screw", "Nail", "Wedge", 
  "Feed", "Board", "Disembark", "Cast on", "Tether", "Untether",
  // Additional General Interactions
  "Unlock", "Force", "Pick-lock", "Disarm", "Clear", "Detonate", "Sabotage", "Disable", "Enable", 
  "Reset", "Override", "Hack", "Configure", "Set up", "Take down", "Assemble", "Disassemble", "Mount", 
  "Dismount", "Flip over", "Turn upside down", "Face", "Point at", "Direct toward", "Align with", 
  "Center on", "Adjust position", "Fine-tune", "Calibrate", "Zero in", "Target lock"
] THEN [1] ELSE [] END |
  CREATE (e)-[:INTERACTED_WITH]->(object))
      `, params);
        // Process player targets in the same pattern
        await tx.run(`
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

// Basic Player interactions
FOREACH(ignoreMe IN CASE WHEN action = "Trade with" THEN [1] ELSE [] END | 
  CREATE (e)-[:TRADED_WITH]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Follow" THEN [1] ELSE [] END | 
  CREATE (e)-[:FOLLOWED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Report" THEN [1] ELSE [] END | 
  CREATE (e)-[:REPORTED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Challenge" THEN [1] ELSE [] END | 
  CREATE (e)-[:CHALLENGED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Attack" THEN [1] ELSE [] END | 
  CREATE (e)-[:ATTACKED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Invite" THEN [1] ELSE [] END | 
  CREATE (e)-[:INVITED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Lookup" THEN [1] ELSE [] END | 
  CREATE (e)-[:LOOKED_UP]->(targetPlayer))

// PvP
FOREACH(ignoreMe IN CASE WHEN action = "Duel" THEN [1] ELSE [] END | 
  CREATE (e)-[:DUELED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Skull-trick" THEN [1] ELSE [] END | 
  CREATE (e)-[:SKULL_TRICKED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Freeze" THEN [1] ELSE [] END | 
  CREATE (e)-[:FROZE]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Teleblock" THEN [1] ELSE [] END | 
  CREATE (e)-[:TELEBLOCKED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Spec" THEN [1] ELSE [] END | 
  CREATE (e)-[:SPECIAL_ATTACKED]->(targetPlayer))

// Group activities
FOREACH(ignoreMe IN CASE WHEN action = "Kick" THEN [1] ELSE [] END | 
  CREATE (e)-[:KICKED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Promote" THEN [1] ELSE [] END | 
  CREATE (e)-[:PROMOTED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Demote" THEN [1] ELSE [] END | 
  CREATE (e)-[:DEMOTED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Share-loot" THEN [1] ELSE [] END | 
  CREATE (e)-[:SHARED_LOOT_WITH]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Request-assist" THEN [1] ELSE [] END | 
  CREATE (e)-[:REQUESTED_ASSIST_FROM]->(targetPlayer))

// Communication
FOREACH(ignoreMe IN CASE WHEN action = "Message" THEN [1] ELSE [] END | 
  CREATE (e)-[:MESSAGED]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Emote-to" THEN [1] ELSE [] END | 
  CREATE (e)-[:EMOTED_TO]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Show-stats" THEN [1] ELSE [] END | 
  CREATE (e)-[:SHOWED_STATS_TO]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Show-items" THEN [1] ELSE [] END | 
  CREATE (e)-[:SHOWED_ITEMS_TO]->(targetPlayer))
  
FOREACH(ignoreMe IN CASE WHEN action = "Show-kc" THEN [1] ELSE [] END | 
  CREATE (e)-[:SHOWED_KC_TO]->(targetPlayer))

// Catch-all for any player actions not explicitly defined
FOREACH(ignoreMe IN CASE WHEN NOT action IN [
  "Trade with", "Follow", "Report", "Challenge", "Attack", "Invite", "Lookup",
  "Duel", "Skull-trick", "Freeze", "TB", "Spec",
  "Kick", "Promote", "Demote", "Share-loot", "Request-assist",
  "Message", "Emote-to", "Show-stats", "Show-items", "Show-kc"
] THEN [1] ELSE [] END | 
  CREATE (e)-[:INTERACTED_WITH]->(targetPlayer))
      `, params);
        // Handle locations
        return tx.run(`
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
      `, params);
    });
};
exports.batchProcessMenuClicks = batchProcessMenuClicks;
exports.default = exports.batchProcessMenuClicks;
//# sourceMappingURL=menuClick.js.map