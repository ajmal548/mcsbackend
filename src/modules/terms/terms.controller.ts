import { Request, Response } from 'express';
import { termsService, AdminContext } from './terms.service';
import { sendSuccess } from '../../utils/responseHandlers';
import {
  CreateTermsDTO,
  UpdateTermsDTO,
  GetTermsQueryDTO,
  GetTermsAuditQueryDTO,
} from './terms.schema';
import { AuthRequest } from '../../middlewares/jwtVerification';
import { UnauthorizedError } from '../../utils/appError';

/**
 * Extracts authenticated admin identity safely from request.
 */
const getAdminContext = (req: AuthRequest): AdminContext => {
  const admin = req.admin || req.user;
  if (!admin || !admin._id || !admin.email) {
    throw new UnauthorizedError('Admin authentication required', 'UNAUTHORIZED_ADMIN');
  }
  return {
    adminId: admin._id,
    adminEmail: admin.email,
  };
};

/**
 * Admin: Create Terms & Conditions
 * POST /api/admin/terms
 */
export const createTerms = async (req: AuthRequest, res: Response) => {
  const adminContext = getAdminContext(req);
  const result = await termsService.createTerms(req.body as CreateTermsDTO, adminContext);
  return sendSuccess(res, result, 'Terms and Conditions created successfully', 201);
};

/**
 * Admin: Update Terms & Conditions
 * PUT /api/admin/terms/:id
 */
export const updateTerms = async (req: AuthRequest, res: Response) => {
  const adminContext = getAdminContext(req);
  const id = req.params.id as string;
  const result = await termsService.updateTerms(id, req.body as UpdateTermsDTO, adminContext);
  return sendSuccess(res, result, 'Terms and Conditions updated successfully', 200);
};

/**
 * Admin: Delete Terms & Conditions (Soft Delete)
 * DELETE /api/admin/terms/:id
 */
export const deleteTerms = async (req: AuthRequest, res: Response) => {
  const adminContext = getAdminContext(req);
  const id = req.params.id as string;
  const result = await termsService.deleteTerms(id, adminContext);
  return sendSuccess(res, result, 'Terms and Conditions deleted successfully', 200);
};

/**
 * Public: Get currently active published Terms & Conditions
 * GET /api/terms/active
 */
export const getActiveTerms = async (_req: Request, res: Response) => {
  const result = await termsService.getActiveTerms();
  return sendSuccess(res, result, 'Active Terms and Conditions retrieved successfully', 200);
};

/**
 * Admin: Get Terms & Conditions by ID
 * GET /api/admin/terms/:id
 */
export const getTermsById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await termsService.getTermsById(id);
  return sendSuccess(res, result, 'Terms and Conditions details retrieved successfully', 200);
};

/**
 * Admin: Get paginated list of Terms & Conditions
 * GET /api/admin/terms
 */
export const getTermsList = async (req: Request, res: Response) => {
  const { items, meta } = await termsService.getTermsList(
    req.query as unknown as GetTermsQueryDTO
  );
  return sendSuccess(res, items, 'Terms and Conditions list retrieved successfully', 200, meta);
};

/**
 * Admin: Get audit logs for a specific Terms document
 * GET /api/admin/terms/:id/audit
 */
export const getTermsAuditLogs = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { items, meta } = await termsService.getTermsAuditLogs(
    id,
    req.query as unknown as GetTermsAuditQueryDTO
  );
  return sendSuccess(res, items, 'Terms audit logs retrieved successfully', 200, meta);
};

/**
 * Admin: Get global audit logs
 * GET /api/admin/terms/audit
 */
export const getGlobalAuditLogs = async (req: Request, res: Response) => {
  const { items, meta } = await termsService.getGlobalAuditLogs(
    req.query as unknown as GetTermsAuditQueryDTO
  );
  return sendSuccess(res, items, 'Global terms audit logs retrieved successfully', 200, meta);
};
