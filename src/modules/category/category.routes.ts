import { Router } from 'express';
import categoryPaths from './category.paths';
import * as controller from './category.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import { verifyAdmin } from '../../middlewares/jwtVerification';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
} from '../../validations/category.validations';

const router = Router();

// GET /api/categories (Public) | POST /api/categories (Admin Only)
router
  .route(categoryPaths.base)
  .get(validateRequest(getCategoriesSchema), handleError(controller.getCategories))
  .post(verifyAdmin, validateRequest(createCategorySchema), handleError(controller.createCategory));

// GET /api/categories/:id (Public) | PUT, DELETE /api/categories/:id (Admin Only)
router
  .route(categoryPaths.byId)
  .get(handleError(controller.getCategoryById))
  .put(verifyAdmin, validateRequest(updateCategorySchema), handleError(controller.updateCategory))
  .delete(verifyAdmin, handleError(controller.deleteCategory));

export default router;
