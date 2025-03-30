import { Request, Response, NextFunction } from 'express';
import { UserTable } from '../types/database.types';
import db from '../config/database';
import logger from '../utils/logger';
import { ApiError } from '../middlewares/error.middleware';

/**
 * Get user information
 * @route GET /user/info/:account?
 */
export const getUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { account } = req.params;
    const database = process.env.MINDRUNE_DB || 'mindrune';
    
    let query = `SELECT account, alias, img, registered FROM user_header`;
    let params: string[] = [];
    
    if (account) {
      query += ` WHERE account = ?`;
      params.push(account);
    }
    
    const userRecords = await db.executeQuery<UserTable[]>(query, params, database);
    
    res.status(200).json({
      success: true,
      data: userRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user registration key
 * @route POST /user/registrationKey
 */
export const getRegistrationKey = async (
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
    const database = process.env.MINDRUNE_DB || 'mindrune';
    
    const query = `SELECT registration_key FROM user_header WHERE account = ?`;
    const registrationKey = await db.executeQuery<UserTable[]>(query, [account], database);
    
    res.status(200).json({
      success: true,
      result: registrationKey,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUserInfo,
  getRegistrationKey,
};