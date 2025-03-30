"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
/**
 * Create a logger instance with appropriate formatting
 */
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
    defaultMeta: { service: 'mindrune-api' },
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with level `info` and below to `combined.log`
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// If we're not in production, log to the console with colored format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map