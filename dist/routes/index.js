"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.osrsRoutes = exports.userRoutes = exports.authRoutes = void 0;
const auth_1 = __importDefault(require("./auth"));
exports.authRoutes = auth_1.default;
const user_1 = __importDefault(require("./user"));
exports.userRoutes = user_1.default;
const osrs_1 = __importDefault(require("./osrs"));
exports.osrsRoutes = osrs_1.default;
//# sourceMappingURL=index.js.map