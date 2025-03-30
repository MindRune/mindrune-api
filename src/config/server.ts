require('dotenv').config()
import fs from 'fs';
import http from 'http';
import https from 'https';
import { Express } from 'express';
import logger from '../utils/logger';

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
export const createServer = (app: Express, config: ServerConfig): http.Server | https.Server => {
  if (config.sslKeyPath && config.sslCertPath) {
    try {
      const privateKey = fs.readFileSync(config.sslKeyPath);
      const certificate = fs.readFileSync(config.sslCertPath);
      
      logger.info(`Creating HTTPS server on port ${config.port}`);
      return https.createServer(
        {
          key: privateKey,
          cert: certificate,
        },
        app
      );
    } catch (error) {
      logger.error(`Failed to load SSL certificates: ${(error as Error).message}`);
      logger.warn('Falling back to HTTP server');
    }
  }
  
  logger.info(`Creating HTTP server on port ${config.port}`);
  return http.createServer(app);
};

/**
 * Get server configuration from environment variables
 * @returns Server configuration
 */
export const getServerConfig = (): ServerConfig => {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    sslKeyPath: process.env.SSL_KEY_PATH || undefined,
    sslCertPath: process.env.SSL_CERT_PATH || undefined,
  };
};

/**
 * Normalize port into a number, string, or false
 * @param val - Port value
 * @returns Normalized port
 */
export const normalizePort = (val: string): number | string | boolean => {
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

/**
 * On error handler for HTTP server
 * @param port - Server port
 * @returns Error handler function
 */
export const onError = (port: number | string | boolean) => (error: NodeJS.ErrnoException): void => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

/**
 * On listening handler for HTTP server
 * @param server - HTTP or HTTPS server
 * @returns Listening handler function
 */
export const onListening = (server: http.Server | https.Server) => (): void => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + (addr?.port || 'unknown');
  logger.info(`Server listening on ${bind}`);
};

export default {
  createServer,
  getServerConfig,
  normalizePort,
  onError,
  onListening,
};