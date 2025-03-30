import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { validationResult } from 'express-validator';
import { ApiError } from '../middlewares/error.middleware';

// Configure this to point to your images directory
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, '../../public/images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Get image by ID
 * @route GET /image/:imageId
 */
export const getImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Invalid request parameters');
    }

    const { imageId } = req.params;
    
    // Simple validation to prevent directory traversal
    if (imageId.includes('/') || imageId.includes('\\') || imageId.includes('..')) {
      throw new ApiError(400, 'Invalid image ID');
    }
    
    // Check for different potential image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    let imagePath = '';
    let contentType = '';
    
    for (const ext of imageExtensions) {
      const testPath = path.join(IMAGES_DIR, `${imageId}${ext}`);
      if (fs.existsSync(testPath)) {
        imagePath = testPath;
        
        // Set appropriate content type
        switch (ext) {
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.gif':
            contentType = 'image/gif';
            break;
          case '.svg':
            contentType = 'image/svg+xml';
            break;
          case '.webp':
            contentType = 'image/webp';
            break;
          default:
            contentType = 'application/octet-stream';
        }
        break;
      }
    }
    
    if (!imagePath) {
      throw new ApiError(404, 'Image not found');
    }
    
    // Set content type and serve the file
    res.setHeader('Content-Type', contentType);
    
    // Optional caching headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get image metadata
 * @route GET /image/:imageId/metadata
 */
export const getImageMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Invalid request parameters');
    }

    const { imageId } = req.params;
    
    // Simple validation to prevent directory traversal
    if (imageId.includes('/') || imageId.includes('\\') || imageId.includes('..')) {
      throw new ApiError(400, 'Invalid image ID');
    }
    
    // Check for different potential image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    let imagePath = '';
    let contentType = '';
    let extension = '';
    
    for (const ext of imageExtensions) {
      const testPath = path.join(IMAGES_DIR, `${imageId}${ext}`);
      if (fs.existsSync(testPath)) {
        imagePath = testPath;
        extension = ext;
        
        // Set appropriate content type
        switch (ext) {
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.gif':
            contentType = 'image/gif';
            break;
          case '.svg':
            contentType = 'image/svg+xml';
            break;
          case '.webp':
            contentType = 'image/webp';
            break;
          default:
            contentType = 'application/octet-stream';
        }
        break;
      }
    }
    
    if (!imagePath) {
      throw new ApiError(404, 'Image not found');
    }
    
    // Get basic file stats
    const stats = fs.statSync(imagePath);
    
    // Create metadata response
    // Note: For a real application, you might want to use something like
    // sharp or probe-image-size to get actual image dimensions
    const metadata = {
      imageId,
      title: imageId, // In a real app, you might store titles in a database
      contentType,
      extension: extension.substring(1), // Remove the leading dot
      fileSize: stats.size,
      lastModified: stats.mtime,
      // Note: In a real application, you would add image dimensions here
      // width: imageWidth,
      // height: imageHeight,
    };
    
    res.status(200).json({
      success: true,
      metadata
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * List available images
 * @route GET /image/list
 */
export const listImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, 'Invalid request parameters');
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get all files in the images directory
    const files = fs.readdirSync(IMAGES_DIR);
    
    // Filter for image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Apply pagination
    const paginatedFiles = imageFiles.slice(offset, offset + limit);
    
    // Create response array
    const images = paginatedFiles.map(file => {
      const fileExt = path.extname(file).toLowerCase();
      const imageId = path.basename(file, fileExt);
      
      // Determine content type
      let contentType = 'application/octet-stream';
      switch (fileExt) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
      }
      
      return {
        imageId,
        title: imageId, // In a real app, you might fetch titles from a database
        url: `/image/${imageId}`,
        contentType,
        extension: fileExt.substring(1) // Remove the leading dot
      };
    });
    
    res.status(200).json({
      success: true,
      images,
      totalCount: imageFiles.length
    });
    
  } catch (error) {
    next(error);
  }
};

export default {
  getImage,
  getImageMetadata,
  listImages
};