"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagementClient = exports.getAuthClient = exports.initClients = exports.getConfig = void 0;
require('dotenv').config();
const auth0_1 = require("auth0");
const logger_1 = __importDefault(require("../utils/logger"));
let authClient = null;
let managementClient = null;
/**
 * Get Auth0 configuration from environment variables
 * @returns Auth0 configuration
 */
const getConfig = () => {
    return {
        domain: process.env.AUTH0_DOMAIN || '',
        clientId: process.env.AUTH0_CLIENT_ID || '',
        clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
        audience: process.env.AUTH0_AUDIENCE || '',
        connection: process.env.AUTH0_CONNECTION || 'discord'
    };
};
exports.getConfig = getConfig;
/**
 * Initialize Auth0 clients
 */
const initClients = () => {
    const config = (0, exports.getConfig)();
    if (!config.domain || !config.clientId || !config.clientSecret) {
        logger_1.default.error('Auth0 configuration is incomplete');
        throw new Error('Auth0 configuration is incomplete');
    }
    authClient = new auth0_1.AuthenticationClient({
        domain: config.domain,
        clientId: config.clientId,
        clientSecret: config.clientSecret
    });
    managementClient = new auth0_1.ManagementClient({
        domain: config.domain,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        audience: `https://${config.domain}/api/v2/`
    });
    logger_1.default.info('Auth0 clients initialized successfully');
};
exports.initClients = initClients;
/**
 * Get Auth0 authentication client
 * @returns Auth0 authentication client
 */
const getAuthClient = () => {
    if (!authClient) {
        (0, exports.initClients)();
    }
    return authClient;
};
exports.getAuthClient = getAuthClient;
/**
 * Get Auth0 management client
 * @returns Auth0 management client
 */
const getManagementClient = () => {
    if (!managementClient) {
        (0, exports.initClients)();
    }
    return managementClient;
};
exports.getManagementClient = getManagementClient;
const auth0 = {
    getConfig: exports.getConfig,
    initClients: exports.initClients,
    getAuthClient: exports.getAuthClient,
    getManagementClient: exports.getManagementClient
};
exports.default = auth0;
//# sourceMappingURL=auth0.js.map