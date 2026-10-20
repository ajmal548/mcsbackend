import { Request, Response } from 'express';
import * as uploadService from './upload.service';
import AppError from '../../utils/appError';
import { sendSuccess } from '../../utils/responseHandlers';
import { AuthRequest } from '../../middlewares/jwtVerification';

const getMechanicId = (req: AuthRequest) =>
  (req.body?.mechanicId as string | undefined) ||
  (req.query?.mechanicId as string | undefined) ||
  (req.role === 'mechanic' ? req.userId?.toString() : undefined);

export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded. Send multipart/form-data with field "file".', 400);
  }
  const result = await uploadService.uploadProfileImageService(req.file, getMechanicId(req));
  return sendSuccess(res, result, 'Profile image uploaded successfully', 201);
};

export const uploadCertificate = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded. Send multipart/form-data with field "file".', 400);
  }
  const result = await uploadService.uploadCertificateService(req.file, getMechanicId(req));
  return sendSuccess(res, result, 'Certificate uploaded successfully', 201);
};

export const deleteUploadedFile = async (req: AuthRequest, res: Response) => {
  const publicId = (req.params.publicId || req.body?.publicId || req.query?.publicId) as string;
  const resourceType = (req.body?.resourceType || req.query?.resourceType || 'image') as any;

  if (!publicId) {
    throw new AppError('publicId is required to delete an uploaded file', 400);
  }

  const result = await uploadService.deleteUploadedFileService(publicId, resourceType);
  return sendSuccess(res, result, 'File removed from storage successfully', 200);
};
