export interface AgentRequest {
    message: string;
    account: string;
    playerId: string;
    playerName?: string;
    context?: Record<string, any>;
}
export interface AgentResponse {
    success: boolean;
    response?: string;
    queryTrace?: any[];
    error?: string;
    msg?: string;
}
export declare const extractAccountFromUser: (user: any) => string | undefined;
