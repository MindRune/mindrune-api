import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UserTable } from '../types/database.types';
import db from '../config/database';
import logger from '../utils/logger';
import { ApiError } from '../middlewares/error.middleware';
import jwt from '../utils/jwt.utils';
import auth0 from '../config/auth0';

/**
 * Auth0 user info interface
 */
interface Auth0UserInfo {
  user_id?: string;
  sub?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Auth0 token response interface
 */
interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Get Auth0 login URL
 * @route GET /auth/login
 */
export const getLoginUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = auth0.getConfig();
    const returnTo = req.query.returnTo as string || process.env.AUTH0_CALLBACK_URL || '';
    
    if (!config.domain || !config.clientId) {
      throw new ApiError(500, 'Auth0 configuration is incomplete');
    }
    
    // Build Auth0 authorization URL
    const authUrl = `https://${config.domain}/authorize?` +
      `response_type=code&` +
      `client_id=${config.clientId}&` +
      `connection=${config.connection}&` + // 'discord' for Discord login
      `redirect_uri=${encodeURIComponent(returnTo)}&` +
      `scope=openid profile email&` +
      `state=${uuidv4()}`;
    
    res.status(200).json({
      success: true,
      authUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Auth0 callback
 * @route POST /auth/callback
 */
export const handleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.body;
    
    if (!code) {
      throw new ApiError(400, 'Authorization code is required');
    }
    
    const config = auth0.getConfig();
    const authClient = auth0.getAuthClient();
    
    // Exchange code for tokens
    const tokenResponse = await authClient.oauth.authorizationCodeGrant({
      code,
      redirect_uri: process.env.AUTH0_CALLBACK_URL || ''
    });
    
    // Get user info
    const userInfo = await authClient.getProfile(tokenResponse.access_token) as Auth0UserInfo;
    
    if (!userInfo.user_id && !userInfo.sub) {
      throw new ApiError(401, 'Failed to get user information');
    }
    
    // Use Auth0 user ID as the account identifier
    const discordUserId = userInfo.sub || userInfo.user_id || '';
    
    // Check if user exists in our database
    const database = process.env.MINDRUNE_DB || 'mindrune';
    let query = `SELECT * FROM user_header WHERE account = ?`;
    let userRecords = await db.executeQuery<UserTable[]>(query, [discordUserId], database);
    
    // Create new user if it doesn't exist
    if (!userRecords || userRecords.length === 0) {
      query = `INSERT INTO user_header VALUES (?,?,?,?,?)`;
      const params = [
        discordUserId,
        userInfo.picture, // Discord avatar as user image
        userInfo.nickname || userInfo.name,
        null, // registration_key (will be set later)
        0, // registered
      ];
      
      await db.executeQuery(query, params, database);
      
      // Retrieve the newly created user
      query = `SELECT * FROM user_header WHERE account = ?`;
      userRecords = await db.executeQuery<UserTable[]>(query, [discordUserId], database);
    }
    
    if (!userRecords || userRecords.length === 0) {
      throw new ApiError(500, 'Failed to create or retrieve user record');
    }
    
    const user = userRecords[0];
    
    // Create JWT token
    const payload = {
      _id: discordUserId,
      account: discordUserId // Keep for backward compatibility
    };
    
    const token = jwt.signToken(payload, '30d'); // 30-day token
    
    // Generate registration key if not exists
    let registrationKey = user.registration_key;
    
    if (!registrationKey) {
      registrationKey = jwt.signToken(payload, '100y'); // Never expires (100 years)
      
      // Update user with registration key
      const updateQuery = `UPDATE user_header SET registration_key = ?, registered = ? WHERE account = ?`;
      await db.executeQuery(updateQuery, [registrationKey, 1, discordUserId], database);
    }
    
    // Return successful response
    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user_record: userRecords,
      msg: 'You are now logged in with Discord.'
    });
  } catch (error) {
    logger.error(`Auth callback error: ${(error as Error).message}`);
    next(error);
  }
};

/**
 * Refresh token
 * @route POST /auth/refresh
 */
export const refreshToken = async (
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
    const discordUserId = userRecord.account;
    
    // Create new JWT token
    const payload = {
      _id: discordUserId,
      account: discordUserId
    };
    
    const token = jwt.signToken(payload, '30d');
    
    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      msg: 'Token refreshed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get registration key
 * @route GET /auth/registration-key
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
    const discordUserId = userRecord.account;
    const database = process.env.MINDRUNE_DB || 'mindrune';
    
    // Get registration key
    const query = `SELECT registration_key FROM user_header WHERE account = ?`;
    const result = await db.executeQuery<UserTable[]>(query, [discordUserId], database);
    
    if (!result || result.length === 0 || !result[0].registration_key) {
      throw new ApiError(404, 'Registration key not found');
    }
    
    res.status(200).json({
      success: true,
      registration_key: result[0].registration_key,
      msg: 'Registration key retrieved successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const authController = {
  getLoginUrl,
  handleCallback,
  refreshToken,
  getRegistrationKey
};

export default authController;