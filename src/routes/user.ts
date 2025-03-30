import { Router } from 'express';
import userController from '../controllers/user.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

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
router.get('/info/:account?', userController.getUserInfo);

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
router.post(
  '/registrationKey',
  authMiddleware.authenticateJwt,
  userController.getRegistrationKey
);

export default router;