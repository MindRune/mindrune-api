"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /user/info/{account}:
 *   get:
 *     summary: Get user information
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: account
 *         schema:
 *           type: string
 *         required: false
 *         description: User account (Ethereum address)
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account:
 *                         type: string
 *                       alias:
 *                         type: string
 *                       img:
 *                         type: string
 *                       registered:
 *                         type: number
 *       500:
 *         description: Server error
 */
router.get('/info/:account?', user_controller_1.default.getUserInfo);
/**
 * @swagger
 * /user/registrationKey:
 *   post:
 *     summary: Get user registration key
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registration key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       registration_key:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/registrationKey', auth_middleware_1.default.authenticateJwt, user_controller_1.default.getRegistrationKey);
exports.default = router;
//# sourceMappingURL=user.js.map