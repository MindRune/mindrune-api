import { Neo4jSession } from '../../../types/neo4j.types';
import { GameEvent } from '../../../types/api.types';
/**
 * Process ACHIEVEMENT_DIARY_COMPLETION events
 * @param session - Neo4j session
 * @param events - Game events
 * @param txnUuid - Transaction UUID
 * @param dataUuid - Data UUID
 * @param account - User account
 * @param playerId - Player ID
 */
export declare const batchProcessAchievementDiaries: (session: Neo4jSession, events: (GameEvent & {
    index: number;
})[], txnUuid: string, dataUuid: string, account: string, playerId: string) => Promise<void>;
export default batchProcessAchievementDiaries;
