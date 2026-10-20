import { Router } from 'express';
import uploadPaths from './upload.paths';
import * as controller from './upload.controller';
import { handleError } from '../../utils/helpers';
import { imageUpload, documentUpload } from '../../middlewares/upload';
import { verifyAuth } from '../../middlewares/jwtVerification';

const router = Router();

// Upload Profile Image (Protected with verifyAuth)
router.post(
  uploadPaths.profileImage,
  verifyAuth,
  imageUpload,
  handleError(controller.uploadProfileImage)
);

// Upload Certificate (Protected with verifyAuth)
router.post(
  uploadPaths.certificate,
  verifyAuth,
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
