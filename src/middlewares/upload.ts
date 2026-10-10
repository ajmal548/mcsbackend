import multer from 'multer';
import AppError from '../utils/appError';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

const buildUploader = (allowed: string[], maxMb: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (allowed.includes(file.mimetype)) return cb(null, true);
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400));
    },
  });

// Field name for both uploads is "file"
export const imageUpload = buildUploader(IMAGE_TYPES, 5).single('file');
export const documentUpload = buildUploader(DOCUMENT_TYPES, 10).single('file');
