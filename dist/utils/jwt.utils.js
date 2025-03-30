"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Sign a JWT token
 * @param payload - Token payload
 * @param expiresIn - Token expiration time
 * @returns Signed JWT token
 */
const signToken = (payload, expiresIn) => {
    if (!process.env.JWT_SECRET) {
        logger_1.default.error('JWT_SECRET is not defined in environment variables');
        throw new Error('JWT secret is not configured');
    }
    const secretKey = process.env.JWT_SECRET;
    // TypeScript doesn't correctly infer the types for jwt.sign
    // We need to explicitly cast to avoid type errors
    return jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn });
};
exports.signToken = signToken;
/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 */
const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        logger_1.default.error('JWT_SECRET is not defined in environment variables');
        throw new Error('JWT secret is not configured');
    }
    const secretKey = process.env.JWT_SECRET;
    try {
        return jsonwebtoken_1.default.verify(token, secretKey);
    }
    catch (error) {
        logger_1.default.error(`Error verifying token: ${error.message}`);
        throw new Error(`Invalid token: ${error.message}`);
    }
};
exports.verifyToken = verifyToken;
exports.default = {
    signToken: exports.signToken,
    verifyToken: exports.verifyToken,
};
//# sourceMappingURL=jwt.utils.js.map