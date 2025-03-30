"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRegistered = exports.authenticateJwt = exports.initializePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Initialize passport with JWT strategy
 */
const initializePassport = () => {
    const options = {
        jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || 'default_secret',
    };
    passport_1.default.use('jwt', new passport_jwt_1.Strategy(options, async (jwtPayload, done) => {
        try {
            const database = process.env.MINDRUNE_DB || 'mindrune';
            const query = 'SELECT * FROM user_header WHERE account = ?';
            const userRecords = await database_1.default.executeQuery(query, [jwtPayload._id], database);
            if (userRecords && userRecords.length > 0) {
                return done(null, userRecords);
            }
            return done(null, false);
        }
        catch (error) {
            logger_1.default.error(`Error in JWT strategy: ${error.message}`);
            return done(error, false);
        }
    }));
};
exports.initializePassport = initializePassport;
/**
 * Middleware to authenticate JWT token
 */
const authenticateJwt = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            logger_1.default.error(`JWT authentication error: ${err.message}`);
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
exports.authenticateJwt = authenticateJwt;
/**
 * Middleware to check if user is registered
 */
const requireRegistered = (req, res, next) => {
    if (!req.user || !Array.isArray(req.user) || req.user.length === 0) {
        res.status(401).json({
            success: false,
            msg: 'Authentication required',
        });
        return;
    }
    const user = req.user[0];
    if (user.registered !== 1) {
        res.status(403).json({
            success: false,
            msg: 'User is not registered',
        });
        return;
    }
    next();
};
exports.requireRegistered = requireRegistered;
const authMiddleware = {
    initializePassport: exports.initializePassport,
    authenticateJwt: exports.authenticateJwt,
    requireRegistered: exports.requireRegistered,
};
exports.default = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map