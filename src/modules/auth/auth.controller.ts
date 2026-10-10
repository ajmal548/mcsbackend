import { Request, Response } from 'express';
import { renewTokenService, logoutService } from './auth.service';

export const renewToken = async (req: Request, res: Response): Promise<void> => {
  const result = await renewTokenService(req.body);
  res.status(200).json(result);
};

export const logout = async (req: any, res: Response): Promise<void> => {
  const userId = req.user?._id || req.userId || req.body?.userId;
  const result = await logoutService(userId);
  res.status(200).json(result);
};
