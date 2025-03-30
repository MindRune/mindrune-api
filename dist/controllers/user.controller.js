"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationKey = exports.getUserInfo = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_middleware_1 = require("../middlewares/error.middleware");
/**
 * Get user information
 * @route GET /user/info/:account?
 */
const getUserInfo = async (req, res, next) => {
    try {
        const { account } = req.params;
        const database = process.env.MINDRUNE_DB || 'mindrune';
        let query = `SELECT account, alias, img, registered FROM user_header`;
        let params = [];
        if (account) {
            query += ` WHERE account = ?`;
            params.push(account);
        }
        const userRecords = await database_1.default.executeQuery(query, params, database);
        res.status(200).json({
            success: true,
            data: userRecords,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserInfo = getUserInfo;
/**
 * Get user registration key
 * @route POST /user/registrationKey
 */
const getRegistrationKey = async (req, res, next) => {
    try {
        // Get user from request (set by JWT authentication middleware)
        if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
            throw new error_middleware_1.ApiError(401, 'Authentication required');
        }
        const userRecord = req.user[0];
        const account = userRecord.account;
        const database = process.env.MINDRUNE_DB || 'mindrune';
        const query = `SELECT registration_key FROM user_header WHERE account = ?`;
        const registrationKey = await database_1.default.executeQuery(query, [account], database);
        res.status(200).json({
            success: true,
            result: registrationKey,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRegistrationKey = getRegistrationKey;
exports.default = {
    getUserInfo: exports.getUserInfo,
    getRegistrationKey: exports.getRegistrationKey,
};
//# sourceMappingURL=user.controller.js.map