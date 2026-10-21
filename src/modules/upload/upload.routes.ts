import { Router } from 'express';
import uploadPaths from './upload.paths';
import * as controller from './upload.controller';
import { handleError } from '../../utils/helpers';
import { imageUpload, documentUpload } from '../../middlewares/upload';
import { verifyAuth, optionalAuth } from '../../middlewares/jwtVerification';

const router = Router();

// Upload Profile Image (Optional Auth: allows unauthenticated uploads during registration)
router.post(
  uploadPaths.profileImage,
  optionalAuth,
  imageUpload,
  handleError(controller.uploadProfileImage)
);

// Upload Certificate (Optional Auth: allows unauthenticated uploads during registration)
router.post(
  uploadPaths.certificate,
  optionalAuth,
  documentUpload,
  handleError(controller.uploadCertificate)
);

// Delete Uploaded File (Protected with verifyAuth)
router.delete(
  '/file',
  verifyAuth,
  handleError(controller.deleteUploadedFile)
);

router.delete(
  '/file/:publicId',
  verifyAuth,
  handleError(controller.deleteUploadedFile)
);

export default router;
