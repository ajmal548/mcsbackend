import { Router } from 'express';
import { TERMS_PATHS } from './terms.constants';
import * as controller from './terms.controller';
import { handleError } from '../../utils/helpers';
import validateRequest from '../../middlewares/validator';
import { verifyAdmin } from '../../middlewares/jwtVerification';
import {
  createTermsRequestSchema,
  updateTermsRequestSchema,
  getTermsRequestSchema,
  getTermsByIdRequestSchema,
  getTermsAuditRequestSchema,
  getTermsByIdAuditRequestSchema,
} from './terms.schema';

/**
 * Public Terms & Conditions Router
 * Mounted at: /api/terms
 */
export const publicTermsRouter = Router();

// GET /api/terms/active (Public)
publicTermsRouter
  .route(TERMS_PATHS.ACTIVE)
  .get(handleError(controller.getActiveTerms));

/**
 * Admin Terms & Conditions Router
 * Mounted at: /api/admin/terms
 * All routes are protected by verifyAdmin
 */
export const adminTermsRouter = Router();

// POST /api/admin/terms | GET /api/admin/terms
adminTermsRouter
  .route(TERMS_PATHS.BASE)
  .post(
    verifyAdmin,
    validateRequest(createTermsRequestSchema),
    handleError(controller.createTerms)
  )
  .get(
    verifyAdmin,
    validateRequest(getTermsRequestSchema),
    handleError(controller.getTermsList)
  );

// GET /api/admin/terms/audit (Global Audit Log - must precede /:id)
adminTermsRouter
  .route(TERMS_PATHS.AUDIT)
  .get(
    verifyAdmin,
    validateRequest(getTermsAuditRequestSchema),
    handleError(controller.getGlobalAuditLogs)
  );

// GET, PUT, DELETE /api/admin/terms/:id
adminTermsRouter
  .route(TERMS_PATHS.BY_ID)
  .get(
    verifyAdmin,
    validateRequest(getTermsByIdRequestSchema),
    handleError(controller.getTermsById)
  )
  .put(
    verifyAdmin,
    validateRequest(updateTermsRequestSchema),
    handleError(controller.updateTerms)
  )
  .delete(
    verifyAdmin,
    validateRequest(getTermsByIdRequestSchema),
    handleError(controller.deleteTerms)
  );

// GET /api/admin/terms/:id/audit (Audit log for specific Terms ID)
adminTermsRouter
  .route(TERMS_PATHS.BY_ID_AUDIT)
  .get(
    verifyAdmin,
    validateRequest(getTermsByIdAuditRequestSchema),
    handleError(controller.getTermsAuditLogs)
  );

export default {
  publicTermsRouter,
  adminTermsRouter,
};
