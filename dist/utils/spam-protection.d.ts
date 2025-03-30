import { SpamProtectionResult } from '../types/api.types';
/**
 * Check if a user is making too many requests too quickly
 * @param requestType - Type of request being made
 * @param account - User's account
 * @returns Spam protection result
 */
export declare const checkSpamProtection: (requestType: string, account: string) => Promise<SpamProtectionResult>;
declare const _default: {
    checkSpamProtection: (requestType: string, account: string) => Promise<SpamProtectionResult>;
};
export default _default;
