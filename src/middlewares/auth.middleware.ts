import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { JwtPayload } from '../types/api.types';
import { UserTable } from '../types/database.types';
import db from '../config/database';
import logger from '../utils/logger';

/**
 * Initialize passport with JWT strategy
 */
export const initializePassport = (): void => {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'default_secret',
  };

  passport.use('jwt',
    new JwtStrategy(options, async (jwtPayload: JwtPayload, done) => {
      try {
        const database = process.env.MINDRUNE_DB || 'mindrune';
        const query = 'SELECT * FROM user_header WHERE account = ?';
        const userRecords = await db.executeQuery<UserTable[]>(query, [jwtPayload._id], database);

        if (userRecords && userRecords.length > 0) {
          return done(null, userRecords);
        }
        
        return done(null, false);
      } catch (error) {
        logger.error(`Error in JWT strategy: ${(error as Error).message}`);
        return done(error, false);
      }
    })
  );
};

/**
 * Middleware to authenticate JWT token
 */
export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      logger.error(`JWT authentication error: ${err.message}`);
      next(err);
      return;
    }
    
    if (!user) {
      res.status(401).json({
        success: false,
        msg: info ? info.message : 'Authentication failed',
      });
      return;
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to check if user is registered
 */
export const requireRegistered = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
    res.status(401).json({
      success: false,
      msg: 'Authentication required',
    });
    return;
  }
  
  const user = (req.user as any)[0] as UserTable;
  
  if (user.registered !== 1) {
    res.status(403).json({
      success: false,
      msg: 'User is not registered',
    });
    return;
  }
  
  next();
};

const authMiddleware = {
  initializePassport,
  authenticateJwt,
  requireRegistered,
};

export default authMiddleware;