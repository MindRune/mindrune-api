import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PlayerInfo, GameEvent } from '../../types/api.types';
import { UserTable } from '../../types/database.types';
import db from '../../config/database';
import neo4j from '../../config/neo4j';
import spamProtection from '../../utils/spam-protection';
import logger from '../../utils/logger';
import { ApiError } from '../../middlewares/error.middleware';

// Import all processors
import { batchProcessMenuClicks } from './processors/menuClick';
import { batchProcessXpGains } from './processors/xpGain';
import { batchProcessInventoryChanges } from './processors/inventoryChange';
import { batchProcessHitSplats } from './processors/hitSplat';
import { batchProcessMonsterKills } from './processors/monsterKill';
import { batchProcessWorldChanges } from './processors/worldChange';
import { batchProcessQuestCompletions } from './processors/questCompletion';
import { batchProcessAchievementDiaries } from './processors/achievementDiary';
import { batchProcessCombatAchievements } from './processors/combatAchievement';
import { batchProcessRewards } from './processors/reward';
import { batchProcessGenericEvents } from './processors/generic';

/**
 * Insert game data into Neo4j
 * @param data - Game data
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @returns Operation result
 */
const insertIntoNeo4j = async (
  data: (PlayerInfo | GameEvent)[],
  txnUuid: string,
  dataUuid: string,
  account: string
): Promise<{ success: boolean; eventCount: number }> => {
  const neo4jStartTime = Date.now();
  logger.info(`Starting insertIntoNeo4j for account: ${account}`);
  
  const session = neo4j.getSession();

  try {
    // Extract player info and events
    const playerInfo = data[0] as PlayerInfo;
    const events = data.slice(1) as GameEvent[];
    logger.info(`Processing ${events.length} events`);

    // Create/Update Player node only (no Transaction node)
    const nodesCreationStartTime = Date.now();
    logger.info(`Creating/updating player node`);
    
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
          account,
          playerId: playerInfo.playerId,
          playerName: playerInfo.playerName || 'Unknown Player',
          combatLevel: playerInfo.combatLevel
        }
      );
    });
    
    logger.info(`Player node updated in ${Date.now() - nodesCreationStartTime}ms`);

    // Group events by type for batch processing
    const eventsByType: Record<string, (GameEvent & { index: number })[]> = {};
    events.forEach((event, index) => {
      if (!eventsByType[event.eventType]) {
        eventsByType[event.eventType] = [];
      }
      eventsByType[event.eventType].push({...event, index});
    });
    
    logger.info(`Grouped events into ${Object.keys(eventsByType).length} types`);

    // Process each event type in batches
    const eventsProcessingStartTime = Date.now();
    
    for (const eventType in eventsByType) {
      const typeStartTime = Date.now();
      const eventsOfType = eventsByType[eventType];
      logger.info(`Processing batch of ${eventsOfType.length} ${eventType} events`);
      
      // Delegate to the appropriate processor based on event type
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
        
        case 'MONSTER_KILL':
          await batchProcessMonsterKills(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
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
        
        case 'REWARD':
          await batchProcessRewards(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
          break;
            
        default:
          await batchProcessGenericEvents(session, eventsOfType, txnUuid, dataUuid, account, playerInfo.playerId);
      }
      
      logger.info(`Completed batch of ${eventsOfType.length} ${eventType} events in ${Date.now() - typeStartTime}ms`);
    }
    
    logger.info(`All events processed in ${Date.now() - eventsProcessingStartTime}ms`);
    logger.info(`Total Neo4j operation time: ${Date.now() - neo4jStartTime}ms`);

    return {
      success: true,
      eventCount: events.length
    };
  } catch (error) {
    logger.error(`Error in Neo4j operations after ${Date.now() - neo4jStartTime}ms: ${(error as Error).message}`);
    throw error;
  } finally {
    await session.close();
    logger.info(`Neo4j session closed after ${Date.now() - neo4jStartTime}ms`);
  }
};

/**
 * Create game data
 * @route POST /osrs/create
 */
export const createGameData = async (req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Get user from request (set by JWT authentication middleware)
      if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
        throw new ApiError(401, 'Authentication required');
      }
      
      const userRecord = (req.user as any)[0] as UserTable;
      const account = userRecord.account;
      const data = req.body;
      
      logger.info(`Starting create request for account: ${account}`);
      
      // Check spam protection
      const request = 'create';
      const spamCheckStartTime = Date.now();
      
      logger.info(`Starting spam protection check for ${account}`);
      const { permission } = await spamProtection.checkSpamProtection(request, account);
      logger.info(`Spam protection check completed in ${Date.now() - spamCheckStartTime}ms`);
      
      if (permission === 'block') {
        logger.warn(`Request frequency limit hit from ${account}`);
        throw new ApiError(429, 'The rate limit for this api key has been reached or the registration key is not valid.');
      }
      
      // Validate data
      if (!data) {
        logger.warn(`Create request with no data from ${account}`);
        throw new ApiError(400, 'No asset provided.');
      }
      
      // Parse data if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Generate UUIDs
      const txnUuid = uuidv4();
      const dataUuid = uuidv4();
      
      // Insert data into Neo4j
      const neo4jStartTime = Date.now();
      logger.info(`Starting Neo4j data insertion for account: ${account}`);
      logger.info(`Data size: ${typeof data === 'string' ? data.length : JSON.stringify(parsedData).length} bytes`);
      logger.info(`Event count: ${parsedData.length - 1}`); // First item is player info
      
      const result = await insertIntoNeo4j(parsedData, txnUuid, dataUuid, account);
      logger.info(`Neo4j insertion completed in ${Date.now() - neo4jStartTime}ms`);
      
      // Insert transaction data into SQL database
      const database = process.env.MINDRUNE_DB || 'mindrune';
      const sqlStartTime = Date.now();
      
      if (database) {
        logger.info(`Starting SQL insertion`);
        
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
        
        await db.executeQuery(txnQuery, txnParams, database);
        
        // Data header
        const dataQuery = `INSERT INTO data_header (data_id, asset_data) VALUES (?,?)`;
        const dataParams = [
          dataUuid,
          typeof data === 'string' ? data : JSON.stringify(data),
        ];
        
        await db.executeQuery(dataQuery, dataParams, database);
        
        logger.info(`SQL insertion completed in ${Date.now() - sqlStartTime}ms`);
      }
      
      // Response timing
      logger.info(`Total request processing time: ${Date.now() - startTime}ms`);
      
      // Return successful response
      res.status(200).json({
        success: true,
        msg: 'Action data stored in Neo4j successfully!',
        txn_id: txnUuid,
        data_id: dataUuid,
        eventCount: result.eventCount,
      });
    } catch (error) {
      logger.error(`Error processing create request after ${Date.now() - startTime}ms: ${(error as Error).message}`);
      next(error);
    }
  };
  
  /**
   * Execute Neo4j query
   * @route POST /osrs/query
   */
  export const executeNeo4jQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get user from request (set by JWT authentication middleware)
      if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
        throw new ApiError(401, 'Authentication required');
      }
      
      const userRecord = (req.user as any)[0] as UserTable;
      const account = userRecord.account;
      const { query, params = {} } = req.body;
      
      if (!query) {
        throw new ApiError(400, 'Query is required');
      }
      
      // IMPORTANT: Add user ID to params for security
      // This ensures users can only access their own data
      const secureParams = {
        ...params,
        account,
      };
      
      // Security check: Ensure the query includes account parameter reference
      if (!query.includes('$account')) {
        throw new ApiError(400, 'Query must include $account parameter for security');
      }
      
      // Execute query
      const result = await neo4j.executeQuery(query, secureParams);
      
      // Process result
      const processedResult = neo4j.processQueryResult(result);
      
      res.status(200).json({
        success: true,
        data: processedResult,
      });
    } catch (error) {
      next(error);
    }
  };
  
  export default {
    createGameData,
    executeNeo4jQuery,
  };