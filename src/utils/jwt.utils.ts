import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/api.types';
import logger from './logger';

/**
 * Sign a JWT token
 * @param payload - Token payload
 * @param expiresIn - Token expiration time
 * @returns Signed JWT token
 */
export const signToken = (payload: JwtPayload, expiresIn: string): string => {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT secret is not configured');
  }
  
  const secretKey = process.env.JWT_SECRET;
  
  // TypeScript doesn't correctly infer the types for jwt.sign
  // We need to explicitly cast to avoid type errors
  return jwt.sign(
    payload, 
    secretKey, 
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 */
export const verifyToken = (token: string): JwtPayload => {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT secret is not configured');
  }
  
  const secretKey = process.env.JWT_SECRET;
  
  try {
    return jwt.verify(token, secretKey) as JwtPayload;
  } catch (error) {
    logger.error(`Error verifying token: ${(error as Error).message}`);
    throw new Error(`Invalid token: ${(error as Error).message}`);
  }
};

export default {
  signToken,
  verifyToken,
};