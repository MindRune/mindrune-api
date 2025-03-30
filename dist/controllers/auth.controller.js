"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationKey = exports.refreshToken = exports.handleCallback = exports.getLoginUrl = void 0;
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const error_middleware_1 = require("../middlewares/error.middleware");
const jwt_utils_1 = __importDefault(require("../utils/jwt.utils"));
const auth0_1 = __importDefault(require("../config/auth0"));
/**
 * Get Auth0 login URL
 * @route GET /auth/login
 */
const getLoginUrl = async (req, res, next) => {
    try {
        const config = auth0_1.default.getConfig();
        const returnTo = req.query.returnTo || process.env.AUTH0_CALLBACK_URL || '';
        if (!config.domain || !config.clientId) {
            throw new error_middleware_1.ApiError(500, 'Auth0 configuration is incomplete');
        }
        // Build Auth0 authorization URL
        const authUrl = `https://${config.domain}/authorize?` +
            `response_type=code&` +
            `client_id=${config.clientId}&` +
            `connection=${config.connection}&` + // 'discord' for Discord login
            `redirect_uri=${encodeURIComponent(returnTo)}&` +
            `scope=openid profile email&` +
            `state=${(0, uuid_1.v4)()}`;
        res.status(200).json({
            success: true,
            authUrl
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLoginUrl = getLoginUrl;
/**
 * Handle Auth0 callback
 * @route POST /auth/callback
 */
const handleCallback = async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) {
            throw new error_middleware_1.ApiError(400, 'Authorization code is required');
        }
        const config = auth0_1.default.getConfig();
        const authClient = auth0_1.default.getAuthClient();
        // Exchange code for tokens
        const tokenResponse = await authClient.oauth.authorizationCodeGrant({
            code,
            redirect_uri: process.env.AUTH0_CALLBACK_URL || ''
        });
        // Get user info
        const userInfo = await authClient.getProfile(tokenResponse.access_token);
        if (!userInfo.user_id && !userInfo.sub) {
            throw new error_middleware_1.ApiError(401, 'Failed to get user information');
        }
        // Use Auth0 user ID as the account identifier
        const discordUserId = userInfo.sub || userInfo.user_id || '';
        // Check if user exists in our database
        const database = process.env.MINDRUNE_DB || 'mindrune';
        let query = `SELECT * FROM user_header WHERE account = ?`;
        let userRecords = await database_1.default.executeQuery(query, [discordUserId], database);
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
            await database_1.default.executeQuery(query, params, database);
            // Retrieve the newly created user
            query = `SELECT * FROM user_header WHERE account = ?`;
            userRecords = await database_1.default.executeQuery(query, [discordUserId], database);
        }
        if (!userRecords || userRecords.length === 0) {
            throw new error_middleware_1.ApiError(500, 'Failed to create or retrieve user record');
        }
        const user = userRecords[0];
        // Create JWT token
        const payload = {
            _id: discordUserId,
            account: discordUserId // Keep for backward compatibility
        };
        const token = jwt_utils_1.default.signToken(payload, '30d'); // 30-day token
        // Generate registration key if not exists
        let registrationKey = user.registration_key;
        if (!registrationKey) {
            registrationKey = jwt_utils_1.default.signToken(payload, '100y'); // Never expires (100 years)
            // Update user with registration key
            const updateQuery = `UPDATE user_header SET registration_key = ?, registered = ? WHERE account = ?`;
            await database_1.default.executeQuery(updateQuery, [registrationKey, 1, discordUserId], database);
        }
        // Return successful response
        res.status(200).json({
            success: true,
            token: `Bearer ${token}`,
            user_record: userRecords,
            msg: 'You are now logged in with Discord.'
        });
    }
    catch (error) {
        logger_1.default.error(`Auth callback error: ${error.message}`);
        next(error);
    }
};
exports.handleCallback = handleCallback;
/**
 * Refresh token
 * @route POST /auth/refresh
 */
const refreshToken = async (req, res, next) => {
    try {
        // Get user from request (set by JWT authentication middleware)
        if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
            throw new error_middleware_1.ApiError(401, 'Authentication required');
        }
        const userRecord = req.user[0];
        const discordUserId = userRecord.account;
        // Create new JWT token
        const payload = {
            _id: discordUserId,
            account: discordUserId
        };
        const token = jwt_utils_1.default.signToken(payload, '30d');
        res.status(200).json({
            success: true,
            token: `Bearer ${token}`,
            msg: 'Token refreshed successfully.'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
/**
 * Get registration key
 * @route GET /auth/registration-key
 */
const getRegistrationKey = async (req, res, next) => {
    try {
        // Get user from request (set by JWT authentication middleware)
        if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
            throw new error_middleware_1.ApiError(401, 'Authentication required');
        }
        const userRecord = req.user[0];
        const discordUserId = userRecord.account;
        const database = process.env.MINDRUNE_DB || 'mindrune';
        // Get registration key
        const query = `SELECT registration_key FROM user_header WHERE account = ?`;
        const result = await database_1.default.executeQuery(query, [discordUserId], database);
        if (!result || result.length === 0 || !result[0].registration_key) {
            throw new error_middleware_1.ApiError(404, 'Registration key not found');
        }
        res.status(200).json({
            success: true,
            registration_key: result[0].registration_key,
            msg: 'Registration key retrieved successfully.'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRegistrationKey = getRegistrationKey;
const authController = {
    getLoginUrl: exports.getLoginUrl,
    handleCallback: exports.handleCallback,
    refreshToken: exports.refreshToken,
    getRegistrationKey: exports.getRegistrationKey
};
exports.default = authController;
//# sourceMappingURL=auth.controller.js.map