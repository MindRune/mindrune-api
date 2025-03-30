/**
 * Common API response structure
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    msg?: string;
    error?: string;
}
/**
 * Authentication response with token
 */
export interface AuthResponse {
    success: boolean;
    token?: string;
    user_record?: UserRecord[];
    msg: string;
}
/**
 * User record from database
 */
export interface UserRecord {
    account: string;
    nonce: number;
    alias: string | null;
    twitter: string | null;
    bio: string | null;
    img: string | null;
    registration_key: string | null;
    registered: number;
    points: number;
}
/**
 * JWT Payload structure
 */
export interface JwtPayload {
    _id: string;
    account: string;
    iat?: number;
    exp?: number;
}
/**
 * Registration request
 */
export interface RegistrationRequest {
    account: string;
}
/**
 * Authentication request
 */
export interface AuthRequest {
    account: string;
    signature: string;
}
/**
 * User profile edit request
 */
export interface UserEditRequest {
    alias?: string;
    twitter?: string;
    bio?: string;
    image?: Express.Multer.File;
}
/**
 * Create transaction request
 */
export interface CreateTransactionRequest {
    [key: string]: any;
}
/**
 * Transaction data
 */
export interface TransactionData {
    txn_id: string;
    progress: string;
    request: string;
    miner: string | null;
    receiver: string;
    blockchain: string;
    txn_description: string;
    data_id: string;
    ual: string | null;
    paranet_ual: string;
    keywords: string;
    epochs: string;
    txn_hash: string | null;
    txn_fee: string | null;
    trac_fee: string | null;
    bid: string | null;
    points: number;
}
/**
 * Neo4j query request
 */
export interface Neo4jQueryRequest {
    query: string;
    params?: Record<string, any>;
}
/**
 * Spam protection result
 */
export interface SpamProtectionResult {
    permission: 'allow' | 'block';
}
/**
 * Player information
 */
export interface PlayerInfo {
    playerId: string;
    playerName: string;
    combatLevel: number;
}
/**
 * Game event
 */
export interface GameEvent {
    eventType: string;
    timestamp: string;
    itemName: string;
    playerLocation?: {
        x: number;
        y: number;
        plane: number;
    };
    details: Record<string, any>;
    index?: number;
}
