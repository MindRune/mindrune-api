import { JwtPayload } from '../types/api.types';
/**
 * Sign a JWT token
 * @param payload - Token payload
 * @param expiresIn - Token expiration time
 * @returns Signed JWT token
 */
export declare const signToken: (payload: JwtPayload, expiresIn: string) => string;
/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 */
export declare const verifyToken: (token: string) => JwtPayload;
declare const _default: {
    signToken: (payload: JwtPayload, expiresIn: string) => string;
    verifyToken: (token: string) => JwtPayload;
};
export default _default;
