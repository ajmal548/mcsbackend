import { Router } from 'express';
import mechanicPaths from './mechanic.paths';
import * as controller from './mechanic.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import {
  verifyAuth,
  verifyAdmin,
  verifyMechanic,
  verifySelfOrAdmin,
} from '../../middlewares/jwtVerification';
import {
  mechanicLoginSchema,
  createMechanicSchema,
  updateMechanicSchema,
  updateKycSchema,
  deleteKycSchema,
  updateLocationSchema,
  getNearbyMechanicsSchema,
  getMechanicsSchema,
  acceptTermsSchema,
} from '../../validations/mechanic.validations';

const router = Router();

// Mechanic Login Route (Public)
router
  .route(mechanicPaths.login)
  .post(validateRequest(mechanicLoginSchema), handleError(controller.loginMechanic));

// Base Routes: List Mechanics (Authenticated) | Register Mechanic (Public)
router
  .route(mechanicPaths.base)
  .get(verifyAuth, validateRequest(getMechanicsSchema), handleError(controller.getMechanics))
  .post(validateRequest(createMechanicSchema), handleError(controller.createMechanic));

// Nearby Mechanics Route (Authenticated)
router
  .route(mechanicPaths.nearby)
  .get(verifyAuth, validateRequest(getNearbyMechanicsSchema), handleError(controller.getNearbyMechanics));

// Self-Service Mechanic Endpoints (Guarded strictly with verifyMechanic)
router
  .route(mechanicPaths.me)
  .get(verifyMechanic, handleError(controller.getMe))
  .put(verifyMechanic, validateRequest(updateMechanicSchema), handleError(controller.updateMe));

router
  .route(mechanicPaths.meLocation)
  .patch(verifyMechanic, validateRequest(updateLocationSchema), handleError(controller.updateMyLocation))
  .get(verifyMechanic, handleError(controller.getMyLocation));

router
  .route(mechanicPaths.meKyc)
  .put(verifyMechanic, validateRequest(updateKycSchema), handleError(controller.updateMyKyc))
  .delete(verifyMechanic, validateRequest(deleteKycSchema), handleError(controller.deleteMyKyc));

router
  .route(mechanicPaths.meTerms)
  .patch(verifyMechanic, validateRequest(acceptTermsSchema), handleError(controller.acceptMyTerms));

router
  .route(mechanicPaths.meOverview)
  .get(verifyMechanic, handleError(controller.getMyOverview));

router
  .route(mechanicPaths.mePosts)
  .get(verifyMechanic, handleError(controller.getMyPosts));

// Overview / Analytics Route by ID (Self or Admin)
router
  .route(mechanicPaths.overview)
  .get(verifySelfOrAdmin, handleError(controller.getMechanicOverview));

// KYC Update and Delete Route by ID (Self or Admin)
router
  .route(mechanicPaths.kyc)
  .put(verifySelfOrAdmin, validateRequest(updateKycSchema), handleError(controller.updateKyc))
  .delete(verifySelfOrAdmin, validateRequest(deleteKycSchema), handleError(controller.deleteKyc));

// Mechanic Posts (Public / Mobile App portfolio tab)
router
  .route(mechanicPaths.posts)
  .get(handleError(controller.getMechanicPosts));

// By ID Route (Get: Authenticated | Update: Self or Admin | Delete: Admin Only)
router
  .route(mechanicPaths.byId)
  .get(verifyAuth, handleError(controller.getMechanicById))
  .put(verifySelfOrAdmin, validateRequest(updateMechanicSchema), handleError(controller.updateMechanic))
  .delete(verifyAdmin, handleError(controller.deleteMechanic));

export default router;
