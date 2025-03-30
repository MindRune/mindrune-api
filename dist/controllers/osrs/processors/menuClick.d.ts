import { Neo4jSession } from "../../../types/neo4j.types";
import { GameEvent } from "../../../types/api.types";
/**
 * Determine target type based on action and other context
 * @param action - The action performed
 * @param originalTarget - The original target text
 * @param hasLevel - Whether the target includes level information
 * @returns The determined target type
 */
export declare const determineTargetType: (action: string, originalTarget: string, hasLevel: boolean) => string;
/**
 * Process MENU_CLICK events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
export declare const batchProcessMenuClicks: (session: Neo4jSession, events: (GameEvent & {
    index: number;
})[], txnUuid: string, dataUuid: string, account: string, playerId: string) => Promise<void>;
export default batchProcessMenuClicks;
