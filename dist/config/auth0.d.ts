import { AuthenticationClient, ManagementClient } from 'auth0';
/**
 * Auth0 configuration interface
 */
export interface Auth0Config {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience: string;
    connection: string;
}
/**
 * Get Auth0 configuration from environment variables
 * @returns Auth0 configuration
 */
export declare const getConfig: () => Auth0Config;
/**
 * Initialize Auth0 clients
 */
export declare const initClients: () => void;
/**
 * Get Auth0 authentication client
 * @returns Auth0 authentication client
 */
export declare const getAuthClient: () => AuthenticationClient;
/**
 * Get Auth0 management client
 * @returns Auth0 management client
 */
export declare const getManagementClient: () => ManagementClient;
declare const auth0: {
    getConfig: () => Auth0Config;
    initClients: () => void;
    getAuthClient: () => AuthenticationClient;
    getManagementClient: () => ManagementClient;
};
export default auth0;
