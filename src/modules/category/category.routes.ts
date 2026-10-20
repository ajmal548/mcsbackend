import { Router } from 'express';
import { CATEGORY_PATHS } from './category.constants';
import * as controller from './category.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import { verifyAdmin } from '../../middlewares/jwtVerification';
import {
  createCategoryRequestSchema,
  updateCategoryRequestSchema,
  getCategoriesRequestSchema,
  getCategoryByIdRequestSchema,
} from './category.schema';

const router = Router();

// GET /api/categories (Public) | POST /api/categories (Admin Only)
router
  .route(CATEGORY_PATHS.BASE)
  .get(validateRequest(getCategoriesRequestSchema), handleError(controller.getCategories))
  .post(verifyAdmin, validateRequest(createCategoryRequestSchema), handleError(controller.createCategory));

// GET /api/categories/:id (Public) | PUT, DELETE /api/categories/:id (Admin Only)
router
  .route(CATEGORY_PATHS.BY_ID)
  .get(validateRequest(getCategoryByIdRequestSchema), handleError(controller.getCategoryById))
  .put(verifyAdmin, validateRequest(updateCategoryRequestSchema), handleError(controller.updateCategory))
  .delete(verifyAdmin, validateRequest(getCategoryByIdRequestSchema), handleError(controller.deleteCategory));

export default router;
