"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const image_controller_1 = __importDefault(require("../controllers/image.controller"));
const router = (0, express_1.Router)();
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
router.get('/:imageId', [
    (0, express_validator_1.param)('imageId').isString().notEmpty()
], image_controller_1.default.getImage);
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
router.get('/:imageId/metadata', [
    (0, express_validator_1.param)('imageId').isString().notEmpty()
], image_controller_1.default.getImageMetadata);
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
router.get('/list', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt()
], image_controller_1.default.listImages);
exports.default = router;
//# sourceMappingURL=img.js.map