// Import all processors
import batchProcessMenuClicks from './menuClick';
import batchProcessXpGains from './xpGain';
import batchProcessInventoryChanges from './inventoryChange';
import batchProcessHitSplats from './hitSplat';
import batchProcessWorldChanges from './worldChange';
import batchProcessQuestCompletions from './questCompletion';
import batchProcessAchievementDiaries from './achievementDiary';
import batchProcessCombatAchievements from './combatAchievement';
import batchProcessGenericEvents from './generic';

// Export all processors
export {
  batchProcessMenuClicks,
  batchProcessXpGains,
  batchProcessInventoryChanges,
  batchProcessHitSplats,
  batchProcessWorldChanges,
  batchProcessQuestCompletions,
  batchProcessAchievementDiaries,
  batchProcessCombatAchievements,
  batchProcessGenericEvents
};