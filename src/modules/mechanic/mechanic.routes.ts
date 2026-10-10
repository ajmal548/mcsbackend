import { Router } from 'express';
import mechanicPaths from './mechanic.paths';
import * as controller from './mechanic.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import {
  mechanicLoginSchema,
  createMechanicSchema,
  updateMechanicSchema,
  updateKycSchema,
  getMechanicsSchema,
} from '../../validations/mechanic.validations';

const router = Router();

// Mechanic Login Route
router
  .route(mechanicPaths.login)
  .post(validateRequest(mechanicLoginSchema), handleError(controller.loginMechanic));

router
  .route(mechanicPaths.base)
  .get(validateRequest(getMechanicsSchema), handleError(controller.getMechanics))
  .post(validateRequest(createMechanicSchema), handleError(controller.createMechanic));

// KYC Update Route (Auto approves pending mechanic upon successful KYC submission)
router
  .route(mechanicPaths.kyc)
  .put(validateRequest(updateKycSchema), handleError(controller.updateKyc));

// Overview / Analytics Route
router
  .route(mechanicPaths.overview)
  .get(handleError(controller.getMechanicOverview));

router
  .route(mechanicPaths.byId)
  .get(handleError(controller.getMechanicById))
  .put(validateRequest(updateMechanicSchema), handleError(controller.updateMechanic))
  .delete(handleError(controller.deleteMechanic));

export default router;
