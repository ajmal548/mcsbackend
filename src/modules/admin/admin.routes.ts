import { Router } from 'express';
import adminPaths from './admin.paths';
import * as controller from './admin.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import {
  adminLoginSchema,
  adminCreateSchema,
  adminUpdateSchema,
} from '../../validations/admin.validations';

import { mechanicLoginSchema } from '../../validations/mechanic.validations';
import { loginMechanic } from '../mechanic/mechanic.controller';

const router = Router();

// Admin Login
router.post(
  adminPaths.auth.login,
  validateRequest(adminLoginSchema),
  handleError(controller.login)
);

// Mechanic Login alias under /auth/mechanic/login
router.post(
  '/mechanic/login',
  validateRequest(mechanicLoginSchema),
  handleError(loginMechanic)
);

// Admin List & Create
router
  .route(adminPaths.admin.base)
  .get(handleError(controller.getAdmins))
  .post(validateRequest(adminCreateSchema), handleError(controller.register));

// Alternative list route
router.get(adminPaths.admin.list, handleError(controller.getAdmins));

// Admin Details, Update, and Delete
router
  .route(adminPaths.admin.byId)
  .get(handleError(controller.getAdminById))
  .put(validateRequest(adminUpdateSchema), handleError(controller.updateAdmin))
  .delete(handleError(controller.deleteAdmin));

export default router;
