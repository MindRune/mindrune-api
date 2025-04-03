"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAccountFromUser = void 0;
// A helper function to extract account from the request user
const extractAccountFromUser = (user) => {
    if (Array.isArray(user) && user.length > 0) {
        return user[0].account;
    }
    return undefined;
};
exports.extractAccountFromUser = extractAccountFromUser;
//# sourceMappingURL=agent.type.js.map