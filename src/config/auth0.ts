require('dotenv').config()
import { AuthenticationClient, ManagementClient } from 'auth0';
import logger from '../utils/logger';

/**
 * Auth0 configuration interface
 */
export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience: string;
  connection: string; // 'discord' for Discord authentication
}

let authClient: AuthenticationClient | null = null;
let managementClient: ManagementClient | null = null;

/**
 * Get Auth0 configuration from environment variables
 * @returns Auth0 configuration
 */
export const getConfig = (): Auth0Config => {
  return {
    domain: process.env.AUTH0_DOMAIN || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    connection: process.env.AUTH0_CONNECTION || 'discord'
  };
};

/**
 * Initialize Auth0 clients
 */
export const initClients = (): void => {
  const config = getConfig();

  if (!config.domain || !config.clientId || !config.clientSecret) {
    logger.error('Auth0 configuration is incomplete');
    throw new Error('Auth0 configuration is incomplete');
  }
  
  authClient = new AuthenticationClient({
    domain: config.domain,
    clientId: config.clientId,
    clientSecret: config.clientSecret
  });
  
  managementClient = new ManagementClient({
    domain: config.domain,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    audience: `https://${config.domain}/api/v2/`
  });
  
  logger.info('Auth0 clients initialized successfully');
};

/**
 * Get Auth0 authentication client
 * @returns Auth0 authentication client
 */
export const getAuthClient = (): AuthenticationClient => {
  if (!authClient) {
    initClients();
  }
  return authClient!;
};

/**
 * Get Auth0 management client
 * @returns Auth0 management client
 */
export const getManagementClient = (): ManagementClient => {
  if (!managementClient) {
    initClients();
  }
  return managementClient!;
};

const auth0 = {
  getConfig,
  initClients,
  getAuthClient,
  getManagementClient
};

export default auth0;