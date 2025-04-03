import { UserTable } from './database.types';

// Request type for the agent service
export interface AgentRequest {
  message: string;
  account: string;
  playerId: string;
  playerName?: string;
  context?: Record<string, any>;
}

// Response type from the agent service
export interface AgentResponse {
  success: boolean;
  response?: string;
  queryTrace?: any[];
  error?: string;
  msg?: string;
}

// A helper function to extract account from the request user
export const extractAccountFromUser = (user: any): string | undefined => {
  if (Array.isArray(user) && user.length > 0) {
    return (user[0] as UserTable).account;
  }
  return undefined;
};