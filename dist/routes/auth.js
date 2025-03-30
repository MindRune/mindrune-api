"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Get Discord authentication URL
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: returnTo
 *         schema:
 *           type: string
 *         description: URL to redirect after authentication
 *     responses:
 *       200:
 *         description: Auth URL provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 authUrl:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/login', auth_controller_1.default.getLoginUrl);
/**
 * @swagger
 * /auth/callback:
 *   post:
 *     summary: Handle Auth0 callback
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 registration_key:
 *                   type: string
 *                 user_record:
 *                   type: array
 *                   items:
 *                     type: object
 *                 msg:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.post('/callback', [
    (0, express_validator_1.body)('code').isString().notEmpty(),
], auth_controller_1.default.handleCallback);
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 msg:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/refresh', auth_middleware_1.default.authenticateJwt, auth_controller_1.default.refreshToken);
/**
 * @swagger
 * /auth/registration-key:
 *   get:
 *     summary: Get registration key
 *     tags: [Authentication]
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
 *                 registration_key:
 *                   type: string
 *                 msg:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Registration key not found
 *       500:
 *         description: Server error
 */
router.get('/registration-key', auth_middleware_1.default.authenticateJwt, auth_controller_1.default.getRegistrationKey);
exports.default = router;
//# sourceMappingURL=auth.js.map