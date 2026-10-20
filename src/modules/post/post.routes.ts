import { Router } from 'express';
import { POST_PATHS } from './post.constants';
import * as controller from './post.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import { verifyAuth, verifyMechanic } from '../../middlewares/jwtVerification';
import { postMediaUpload } from '../../middlewares/upload';
import {
  createPostRequestSchema,
  updatePostRequestSchema,
  getPostsRequestSchema,
  getPostByIdRequestSchema,
} from './post.schema';

const router = Router();

// Upload standalone media (image or video)
router.post(
  POST_PATHS.UPLOAD,
  verifyMechanic,
  postMediaUpload,
  handleError(controller.uploadMedia)
);

// One-step multipart upload & publish (file + caption)
router.post(
  '/publish',
  verifyMechanic,
  postMediaUpload,
  handleError(controller.uploadAndCreatePost)
);

// Base: GET /posts (Public Mobile Feed) | POST /posts (Mechanic JSON post publish)
router
  .route(POST_PATHS.BASE)
  .get(validateRequest(getPostsRequestSchema), handleError(controller.getPosts))
  .post(verifyMechanic, validateRequest(createPostRequestSchema), handleError(controller.createPost));

// Views & Likes
router.post(POST_PATHS.VIEW, validateRequest(getPostByIdRequestSchema), handleError(controller.recordView));
router.post(POST_PATHS.LIKE, verifyAuth, validateRequest(getPostByIdRequestSchema), handleError(controller.toggleLike));

// By ID: GET (Public/View) | PUT (Owner/Admin) | DELETE (Owner/Admin)
router
  .route(POST_PATHS.BY_ID)
  .get(validateRequest(getPostByIdRequestSchema), handleError(controller.getPostById))
  .put(verifyAuth, validateRequest(updatePostRequestSchema), handleError(controller.updatePost))
  .delete(verifyAuth, validateRequest(getPostByIdRequestSchema), handleError(controller.deletePost));

export default router;
