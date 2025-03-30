"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onListening = exports.onError = exports.normalizePort = exports.getServerConfig = exports.createServer = void 0;
require('dotenv').config();
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Create server based on configuration
 * @param app - Express application
 * @param config - Server configuration
 * @returns HTTP or HTTPS server
 */
const createServer = (app, config) => {
    if (config.sslKeyPath && config.sslCertPath) {
        try {
            const privateKey = fs_1.default.readFileSync(config.sslKeyPath);
            const certificate = fs_1.default.readFileSync(config.sslCertPath);
            logger_1.default.info(`Creating HTTPS server on port ${config.port}`);
            return https_1.default.createServer({
                key: privateKey,
                cert: certificate,
            }, app);
        }
        catch (error) {
            logger_1.default.error(`Failed to load SSL certificates: ${error.message}`);
            logger_1.default.warn('Falling back to HTTP server');
        }
    }
    logger_1.default.info(`Creating HTTP server on port ${config.port}`);
    return http_1.default.createServer(app);
};
exports.createServer = createServer;
/**
 * Get server configuration from environment variables
 * @returns Server configuration
 */
const getServerConfig = () => {
    return {
        port: parseInt(process.env.PORT || '3000', 10),
        sslKeyPath: process.env.SSL_KEY_PATH || undefined,
        sslCertPath: process.env.SSL_CERT_PATH || undefined,
    };
};
exports.getServerConfig = getServerConfig;
/**
 * Normalize port into a number, string, or false
 * @param val - Port value
 * @returns Normalized port
 */
const normalizePort = (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
};
exports.normalizePort = normalizePort;
/**
 * On error handler for HTTP server
 * @param port - Server port
 * @returns Error handler function
 */
const onError = (port) => (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger_1.default.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger_1.default.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};
exports.onError = onError;
/**
 * On listening handler for HTTP server
 * @param server - HTTP or HTTPS server
 * @returns Listening handler function
 */
const onListening = (server) => () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + (addr?.port || 'unknown');
    logger_1.default.info(`Server listening on ${bind}`);
};
exports.onListening = onListening;
exports.default = {
    createServer: exports.createServer,
    getServerConfig: exports.getServerConfig,
    normalizePort: exports.normalizePort,
    onError: exports.onError,
    onListening: exports.onListening,
};
//# sourceMappingURL=server.js.map