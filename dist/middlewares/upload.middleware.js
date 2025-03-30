"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const error_middleware_1 = require("./error.middleware");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Ensure upload directory exists
 */
const ensureUploadDirExists = () => {
    const dir = process.env.IMAGE_DIRECTORY || 'uploads/images';
    // Create directory recursively if it doesn't exist
    if (!fs_1.default.existsSync(dir)) {
        try {
            fs_1.default.mkdirSync(dir, { recursive: true });
            logger_1.default.info(`Created upload directory: ${dir}`);
        }
        catch (error) {
            logger_1.default.error(`Error creating upload directory: ${error.message}`);
            throw new Error(`Failed to create upload directory: ${dir}`);
        }
    }
};
// Ensure the upload directory exists when this module is imported
ensureUploadDirExists();
/**
 * Configure storage for uploaded files
 */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = process.env.IMAGE_DIRECTORY || 'uploads/images';
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and original extension
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, uniquePrefix + ext);
    }
});
/**
 * Filter files by type
 */
const fileFilter = (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new error_middleware_1.ApiError(400, 'Only image files are allowed'));
    }
};
/**
 * Configure upload limits
 */
const limits = {
    fileSize: 5 * 1024 * 1024, // 5MB
};
/**
 * Create multer instance with configuration
 */
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits,
});
/**
 * Delete a file from the upload directory
 * @param filename - Name of the file to delete
 * @returns Promise that resolves when file is deleted
 */
const deleteFile = async (filename) => {
    if (!filename)
        return;
    const dir = process.env.IMAGE_DIRECTORY || 'uploads/images';
    const filePath = path_1.default.join(dir, filename);
    if (fs_1.default.existsSync(filePath)) {
        try {
            await fs_1.default.promises.unlink(filePath);
            logger_1.default.info(`Successfully deleted file: ${filename}`);
        }
        catch (error) {
            logger_1.default.error(`Error deleting file ${filename}: ${error.message}`);
        }
    }
};
exports.deleteFile = deleteFile;
exports.default = {
    upload: exports.upload,
    deleteFile: exports.deleteFile,
};
//# sourceMappingURL=upload.middleware.js.map