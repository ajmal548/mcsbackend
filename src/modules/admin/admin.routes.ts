import { Router } from 'express';
import adminPaths from './admin.paths';
import * as controller from './admin.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import { verifyAdmin } from '../../middlewares/jwtVerification';
import {
  adminLoginSchema,
  adminCreateSchema,
  adminUpdateSchema,
} from '../../validations/admin.validations';

import { mechanicLoginSchema } from '../../validations/mechanic.validations';
import { loginMechanic } from '../mechanic/mechanic.controller';

const router = Router();

// Admin Login (Public)
router.post(
  adminPaths.auth.login,
  validateRequest(adminLoginSchema),
  handleError(controller.login)
);

// Mechanic Login alias under /auth/mechanic/login (Public)
router.post(
  '/mechanic/login',
  validateRequest(mechanicLoginSchema),
  handleError(loginMechanic)
);

// Admin List & Create (Protected with verifyAdmin)
router
  .route(adminPaths.admin.base)
  .get(verifyAdmin, handleError(controller.getAdmins))
  .post(verifyAdmin, validateRequest(adminCreateSchema), handleError(controller.register));

// Alternative list route (Protected with verifyAdmin)
router.get(adminPaths.admin.list, verifyAdmin, handleError(controller.getAdmins));

// Admin Details, Update, and Delete (Protected with verifyAdmin)
router
  .route(adminPaths.admin.byId)
  .get(verifyAdmin, handleError(controller.getAdminById))
  .put(verifyAdmin, validateRequest(adminUpdateSchema), handleError(controller.updateAdmin))
  .delete(verifyAdmin, handleError(controller.deleteAdmin));

export default router;
