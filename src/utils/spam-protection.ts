import { SpamProtectionResult } from '../types/api.types';
import { UserTable } from '../types/database.types';
import db from '../config/database';
import logger from './logger';

/**
 * Check if a user is making too many requests too quickly
 * @param requestType - Type of request being made
 * @param account - User's account
 * @returns Spam protection result
 */
export const checkSpamProtection = async (
  requestType: string,
  account: string
): Promise<SpamProtectionResult> => {
  logger.info(`Checking if ${account} is spamming with request type: ${requestType}`);
  
  const defaultRate = parseInt(process.env.DEFAULT_RATE_MIN || '10', 10);
  const createRate = parseInt(process.env.CREATE_RATE_MIN || '1', 10);
  const database = process.env.MINDRUNE_DB || 'mindrune';
  
  try {
    // First check if user exists
    const query = `SELECT * FROM user_header WHERE account = ?`;
    const userRecords = await db.executeQuery<UserTable[]>(query, [account], database);
    
    if (!userRecords || userRecords.length === 0) {
      logger.warn(`Account ${account} not found in database`);
      return { permission: 'block' };
    }
    
    // Different rate limiting logic based on request type
    if (requestType === 'create') {
      // For create transactions, check if there's any create action within the last 45 seconds
      const createQuery = `
        SELECT *, TIMESTAMPDIFF(SECOND, created_at, NOW()) as seconds_ago 
        FROM txn_header
        WHERE receiver = ?
        AND request = 'create'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 50 SECOND)
      `;
      
      const recentCreates = await db.executeQuery<any[]>(createQuery, [account], database);
      
      logger.info(`Found ${recentCreates.length} recent create transactions for account ${account}`);
      
      // Log detailed information about each recent transaction for debugging
      if (recentCreates.length > 0) {
        recentCreates.forEach(tx => {
          logger.debug(`Transaction ID: ${tx.id}, Created: ${tx.created_at}, Seconds ago: ${tx.seconds_ago}`);
        });
        return { permission: 'block' };
      }
    } else {
      // For non-create transactions, use the default rate limiting logic
      const defaultQuery = `
        SELECT * FROM txn_header
        WHERE receiver = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 50 SECOND)
      `;
      
      const requestFrequency = await db.executeQuery<any[]>(defaultQuery, [account], database);
      
      // Check if the frequency exceeds the default rate
      if (defaultRate < requestFrequency.length) {
        logger.warn(`Account ${account} exceeded rate limit for ${requestType}`);
        return { permission: 'block' };
      }
    }
    
    // If we've passed all checks, allow the transaction
    return { permission: 'allow' };
  } catch (error) {
    logger.error(`Error in spam protection: ${(error as Error).message}`);
    // Default to allowing in case of error to prevent blocking legitimate requests
    return { permission: 'allow' };
  }
};

export default {
  checkSpamProtection,
};