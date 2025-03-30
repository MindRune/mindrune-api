/**
 * Clean target text by removing level information and color tags
 * Ensures the result is never null or empty
 * @param targetText - Target text to clean
 * @returns Cleaned text or default value if result would be empty
 */
export declare const cleanTargetText: (targetText: string | undefined) => string;
/**
 * Removes special formatting from item names
 * @param itemName - The item name to clean
 * @returns Cleaned item name
 */
export declare const cleanItemName: (itemName: string | undefined) => string;
/**
 * Handles string formatting for NPC names
 * @param npcName - The NPC name to clean
 * @returns Cleaned NPC name
 */
export declare const cleanNpcName: (npcName: string | undefined) => string;
export declare const debugText: (text: string | undefined, label?: string) => void;
declare const _default: {
    cleanTargetText: (targetText: string | undefined) => string;
    cleanItemName: (itemName: string | undefined) => string;
    cleanNpcName: (npcName: string | undefined) => string;
    debugText: (text: string | undefined, label?: string) => void;
};
export default _default;
