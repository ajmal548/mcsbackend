import multer from 'multer';
import AppError from '../utils/appError';

export const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

export const VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/webm',
  'video/3gpp',
  'video/x-matroska',
  'video/mpeg',
];

export const POST_MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

const buildUploader = (allowed: string[], maxMb: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (allowed.includes(file.mimetype)) return cb(null, true);
      cb(new AppError(`Unsupported file type: ${file.mimetype}. Allowed: ${allowed.join(', ')}`, 400));
    },
  });

// Single file uploaders
export const imageUpload = buildUploader(IMAGE_TYPES, 10).single('file');
export const documentUpload = buildUploader(DOCUMENT_TYPES, 15).single('file');
export const videoUpload = buildUploader(VIDEO_TYPES, 100).single('file');

// Post media uploaders (supports image or video)
export const postMediaUpload = buildUploader(POST_MEDIA_TYPES, 100).single('file');
export const postMultipleMediaUpload = buildUploader(POST_MEDIA_TYPES, 100).array('files', 10);
