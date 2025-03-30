import { RowDataPacket, OkPacket, ResultSetHeader, FieldPacket } from 'mysql2';
/**
 * Database query result
 */
export type DbQueryResult = [RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader, FieldPacket[]];
/**
 * MySQL database configuration
 */
export interface DbConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    waitForConnections: boolean;
    connectionLimit: number;
    queueLimit: number;
}
/**
 * Database connection error
 */
export declare class DatabaseError extends Error {
    query?: string | undefined;
    params?: any[] | undefined;
    constructor(message: string, query?: string | undefined, params?: any[] | undefined);
}
/**
 * User table schema
 */
export interface UserTable extends RowDataPacket {
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
 * Transaction header table schema
 */
export interface TransactionHeader extends RowDataPacket {
    txn_id: string;
    progress: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
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
    created_at: Date;
}
/**
 * Data header table schema
 */
export interface DataHeader extends RowDataPacket {
    data_id: string;
    asset_data: string;
    created_at: Date;
}
/**
 * Database connection pool interface
 */
export interface DbConnectionPool {
    query<T extends RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader>(sql: string, values?: any): Promise<[T, FieldPacket[]]>;
    getConnection(): Promise<DbConnection>;
    end(): Promise<void>;
}
/**
 * Database connection interface
 */
export interface DbConnection {
    query<T extends RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader>(sql: string, values?: any): Promise<[T, FieldPacket[]]>;
    release(): void;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
}
