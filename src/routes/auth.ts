import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

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
router.get('/login', authController.getLoginUrl);

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
router.post(
  '/callback',
  [
    body('code').isString().notEmpty(),
  ],
  authController.handleCallback
);

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
router.post('/refresh', authMiddleware.authenticateJwt, authController.refreshToken);

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
router.get('/registration-key', authMiddleware.authenticateJwt, authController.getRegistrationKey);

export default router;