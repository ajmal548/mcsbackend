import { Request, Response } from 'express';
import * as uploadService from './upload.service';
import AppError from '../../utils/appError';

const getMechanicId = (req: Request) =>
  (req.body?.mechanicId as string | undefined) || (req.query.mechanicId as string | undefined);

export const uploadProfileImage = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded. Send multipart/form-data with field "file".', 400);
  const result = await uploadService.uploadProfileImageService(req.file, getMechanicId(req));
  return res.status(201).json(result);
};

export const uploadCertificate = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded. Send multipart/form-data with field "file".', 400);
  const result = await uploadService.uploadCertificateService(req.file, getMechanicId(req));
  return res.status(201).json(result);
};
