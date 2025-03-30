"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchProcessGenericEvents = exports.batchProcessCombatAchievements = exports.batchProcessAchievementDiaries = exports.batchProcessQuestCompletions = exports.batchProcessWorldChanges = exports.batchProcessHitSplats = exports.batchProcessInventoryChanges = exports.batchProcessXpGains = exports.batchProcessMenuClicks = void 0;
// Import all processors
const menuClick_1 = __importDefault(require("./menuClick"));
exports.batchProcessMenuClicks = menuClick_1.default;
const xpGain_1 = __importDefault(require("./xpGain"));
exports.batchProcessXpGains = xpGain_1.default;
const inventoryChange_1 = __importDefault(require("./inventoryChange"));
exports.batchProcessInventoryChanges = inventoryChange_1.default;
const hitSplat_1 = __importDefault(require("./hitSplat"));
exports.batchProcessHitSplats = hitSplat_1.default;
const worldChange_1 = __importDefault(require("./worldChange"));
exports.batchProcessWorldChanges = worldChange_1.default;
const questCompletion_1 = __importDefault(require("./questCompletion"));
exports.batchProcessQuestCompletions = questCompletion_1.default;
const achievementDiary_1 = __importDefault(require("./achievementDiary"));
exports.batchProcessAchievementDiaries = achievementDiary_1.default;
const combatAchievement_1 = __importDefault(require("./combatAchievement"));
exports.batchProcessCombatAchievements = combatAchievement_1.default;
const generic_1 = __importDefault(require("./generic"));
exports.batchProcessGenericEvents = generic_1.default;
//# sourceMappingURL=index.js.map