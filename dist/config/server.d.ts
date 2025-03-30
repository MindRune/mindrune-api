import http from 'http';
import https from 'https';
import { Express } from 'express';
/**
 * Server configuration
 */
export interface ServerConfig {
    port: number;
    sslKeyPath?: string;
    sslCertPath?: string;
}
/**
 * Create server based on configuration
 * @param app - Express application
 * @param config - Server configuration
 * @returns HTTP or HTTPS server
 */
export declare const createServer: (app: Express, config: ServerConfig) => http.Server | https.Server;
/**
 * Get server configuration from environment variables
 * @returns Server configuration
 */
export declare const getServerConfig: () => ServerConfig;
/**
 * Normalize port into a number, string, or false
 * @param val - Port value
 * @returns Normalized port
 */
export declare const normalizePort: (val: string) => number | string | boolean;
/**
 * On error handler for HTTP server
 * @param port - Server port
 * @returns Error handler function
 */
export declare const onError: (port: number | string | boolean) => (error: NodeJS.ErrnoException) => void;
/**
 * On listening handler for HTTP server
 * @param server - HTTP or HTTPS server
 * @returns Listening handler function
 */
export declare const onListening: (server: http.Server | https.Server) => () => void;
declare const _default: {
    createServer: (app: Express, config: ServerConfig) => http.Server | https.Server;
    getServerConfig: () => ServerConfig;
    normalizePort: (val: string) => number | string | boolean;
    onError: (port: number | string | boolean) => (error: NodeJS.ErrnoException) => void;
    onListening: (server: http.Server | https.Server) => () => void;
};
export default _default;
