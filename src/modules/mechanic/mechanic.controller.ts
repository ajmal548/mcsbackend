import { Request, Response } from 'express';
import * as mechanicService from './mechanic.service';
import { sendSuccess } from '../../utils/responseHandlers';
import { AuthRequest } from '../../middlewares/jwtVerification';

export const loginMechanic = async (req: Request, res: Response) => {
  const result = await mechanicService.loginMechanicService(req.body);
  return sendSuccess(res, result, 'Login successful', 200);
};

export const createMechanic = async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1';
  const result = await mechanicService.createMechanicService(req.body, { ip: clientIp });
  return sendSuccess(res, result, 'Mechanic registered successfully', 201);
};

export const getMechanics = async (req: Request, res: Response) => {
  const result = await mechanicService.getMechanicsService(req.query as any);
  return sendSuccess(res, result.data, 'Mechanics retrieved successfully', 200, {
    page: result.pagination.page,
    limit: parseInt((req.query.limit as string) || '10', 10),
    total: result.pagination.total,
    totalPages: result.pagination.pages,
  });
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const result = await mechanicService.getMechanicByIdService(id);
  return sendSuccess(res, result, 'Current mechanic profile retrieved successfully', 200);
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const result = await mechanicService.updateMechanicService(id, req.body, { isAdmin: false });
  return sendSuccess(res, result, 'Mechanic profile updated successfully', 200);
};

export const updateMyKyc = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  // Self-service KYC submission is ALWAYS pending manual review by Admin
  const result = await mechanicService.updateKycService(id, {
    kyc: req.body.kyc,
    kycStatus: 'pending',
    isAdmin: false,
  });
  return sendSuccess(res, result.data, result.message, 200);
};

export const deleteMyKyc = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const documentType = req.query.documentType as string | undefined;
  const result = await mechanicService.deleteKycService(id, {
    documentType,
    isAdmin: false,
  });
  return sendSuccess(res, result.data, result.message, 200);
};

export const getMyOverview = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const result = await mechanicService.getMechanicOverviewService(id);
  return sendSuccess(res, result, 'Mechanic overview retrieved successfully', 200);
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const { postService } = await import('../post/post.service');
  const { items, meta } = await postService.getPosts({
    mechanicId: id,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
  });
  return sendSuccess(res, items, 'Your posts retrieved successfully', 200, meta);
};

export const getMechanicById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.getMechanicByIdService(id);
  return sendSuccess(res, result, 'Mechanic profile retrieved successfully', 200);
};

export const getMechanicOverview = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.getMechanicOverviewService(id);
  return sendSuccess(res, result, 'Mechanic overview retrieved successfully', 200);
};

export const updateMechanic = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const isAdmin = req.role === 'admin';
  const result = await mechanicService.updateMechanicService(id, req.body, { isAdmin });
  return sendSuccess(res, result, 'Mechanic updated successfully', 200);
};

export const updateKyc = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const isAdmin = req.role === 'admin';
  const result = await mechanicService.updateKycService(id, {
    kyc: req.body.kyc,
    kycStatus: req.body.kycStatus,
    isAdmin,
  });
  return sendSuccess(res, result.data, result.message, 200);
};

export const deleteKyc = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const isAdmin = req.role === 'admin';
  const documentType = req.query.documentType as string | undefined;
  const result = await mechanicService.deleteKycService(id, {
    documentType,
    isAdmin,
  });
  return sendSuccess(res, result.data, result.message, 200);
};

export const deleteMechanic = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.deleteMechanicService(id);
  return sendSuccess(res, result, 'Mechanic removed successfully', 200);
};

export const getMechanicPosts = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { postService } = await import('../post/post.service');
  const { items, meta } = await postService.getPosts({
    mechanicId: id,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
  });
  return sendSuccess(res, items, 'Mechanic posts retrieved successfully', 200, meta);
};

export const updateMyLocation = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const result = await mechanicService.updateMechanicLocationService(id, {
    latitude: req.body.latitude,
    longitude: req.body.longitude,
  });
  return sendSuccess(res, result, 'Mechanic location updated successfully', 200);
};

export const getMyLocation = async (req: AuthRequest, res: Response) => {
  const id = req.userId?.toString();
  const result = await mechanicService.getMechanicLocationService(id);
  return sendSuccess(res, result, 'Mechanic location retrieved successfully', 200);
};

export const getNearbyMechanics = async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000;
  const result = await mechanicService.getNearbyMechanicsService({ lat, lng, radius });
  return sendSuccess(res, result, 'Nearby mechanics retrieved successfully', 200);
};

export const acceptMyTerms = async (req: AuthRequest, res: Response) => {
  const mechanicId = (req.userId || req.mechanic?._id || req.user?._id)?.toString();
  const { version } = req.body;
  const result = await mechanicService.acceptTermsService(mechanicId, version);
  return sendSuccess(res, result, 'Terms and Conditions accepted successfully', 200);
};

