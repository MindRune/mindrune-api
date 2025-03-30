import { Router } from 'express';
import { param, query } from 'express-validator';
import imageController from '../controllers/image.controller';

const router = Router();

/**
 * @swagger
 * /image/{imageId}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image to retrieve
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:imageId',
  [
    param('imageId').isString().notEmpty()
  ],
  imageController.getImage
);

/**
 * @swagger
 * /image/{imageId}/metadata:
 *   get:
 *     summary: Get image metadata
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image
 *     responses:
 *       200:
 *         description: Metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     imageId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     contentType:
 *                       type: string
 *                     width:
 *                       type: integer
 *                     height:
 *                       type: integer
 *                     fileSize:
 *                       type: integer
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:imageId/metadata',
  [
    param('imageId').isString().notEmpty()
  ],
  imageController.getImageMetadata
);

/**
 * @swagger
 * /image/list:
 *   get:
 *     summary: List available images
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       imageId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       url:
 *                         type: string
 *                       contentType:
 *                         type: string
 *                 totalCount:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get(
  '/list',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  imageController.listImages
);

export default router;