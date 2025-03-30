import { Router } from 'express';
import osrsController from '../controllers/osrs';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /osrs/create:
 *   post:
 *     summary: Create game data
 *     tags: [OSRS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Game data created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 msg:
 *                   type: string
 *                 txn_id:
 *                   type: string
 *                 data_id:
 *                   type: string
 *                 eventCount:
 *                   type: number
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post(
  '/create',
  authMiddleware.authenticateJwt,
  osrsController.createGameData
);

/**
 * @swagger
 * /osrs/query:
 *   post:
 *     summary: Execute Neo4j query
 *     tags: [OSRS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       200:
 *         description: Query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/query',
  authMiddleware.authenticateJwt,
  osrsController.executeNeo4jQuery
);

export default router;