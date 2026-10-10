import { Router } from 'express';
import uploadPaths from './upload.paths';
import * as controller from './upload.controller';
import { handleError } from '../../utils/helpers';
import { imageUpload, documentUpload } from '../../middlewares/upload';

const router = Router();

// multipart/form-data: file (image, max 5MB), mechanicId (optional)
router.post(uploadPaths.profileImage, imageUpload, handleError(controller.uploadProfileImage));

// multipart/form-data: file (image or PDF, max 10MB), mechanicId (optional)
router.post(uploadPaths.certificate, documentUpload, handleError(controller.uploadCertificate));

export default router;
