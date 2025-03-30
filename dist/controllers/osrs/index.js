"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeNeo4jQuery = exports.createGameData = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../../config/database"));
const neo4j_1 = __importDefault(require("../../config/neo4j"));
const spam_protection_1 = __importDefault(require("../../utils/spam-protection"));
const logger_1 = __importDefault(require("../../utils/logger"));
const error_middleware_1 = require("../../middlewares/error.middleware");
// Import all processors
const menuClick_1 = require("./processors/menuClick");
const xpGain_1 = require("./processors/xpGain");
const inventoryChange_1 = require("./processors/inventoryChange");
const hitSplat_1 = require("./processors/hitSplat");
const monsterKill_1 = require("./processors/monsterKill");
const worldChange_1 = require("./processors/worldChange");
const questCompletion_1 = require("./processors/questCompletion");
const achievementDiary_1 = require("./processors/achievementDiary");
const combatAchievement_1 = require("./processors/combatAchievement");
const reward_1 = require("./processors/reward");
const generic_1 = require("./processors/generic");
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
            // Delegate to the appropriate processor based on event type
            switch (eventType) {
                case 'MENU_CLICK':
                    await (0, menuClick_1.batchProcessMenuClicks)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'XP_GAIN':
                    await (0, xpGain_1.batchProcessXpGains)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'INVENTORY_CHANGE':
                    await (0, inventoryChange_1.batchProcessInventoryChanges)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'HIT_SPLAT':
                    await (0, hitSplat_1.batchProcessHitSplats)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'MONSTER_KILL':
                    await (0, monsterKill_1.batchProcessMonsterKills)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'WORLD_CHANGE':
                    await (0, worldChange_1.batchProcessWorldChanges)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'QUEST_COMPLETION':
                    await (0, questCompletion_1.batchProcessQuestCompletions)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'ACHIEVEMENT_DIARY_COMPLETION':
                    await (0, achievementDiary_1.batchProcessAchievementDiaries)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'COMBAT_ACHIEVEMENT_COMPLETION':
                    await (0, combatAchievement_1.batchProcessCombatAchievements)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                case 'REWARD':
                    await (0, reward_1.batchProcessRewards)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
                    break;
                default:
                    await (0, generic_1.batchProcessGenericEvents)(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
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
//# sourceMappingURL=index.js.map