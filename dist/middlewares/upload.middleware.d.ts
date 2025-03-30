import multer from 'multer';
/**
 * Create multer instance with configuration
 */
export declare const upload: multer.Multer;
/**
 * Delete a file from the upload directory
 * @param filename - Name of the file to delete
 * @returns Promise that resolves when file is deleted
 */
export declare const deleteFile: (filename: string) => Promise<void>;
declare const _default: {
    upload: multer.Multer;
    deleteFile: (filename: string) => Promise<void>;
};
export default _default;
