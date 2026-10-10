import { Request, Response } from 'express';
import * as mechanicService from './mechanic.service';

export const loginMechanic = async (req: Request, res: Response) => {
  const result = await mechanicService.loginMechanicService(req.body);
  return res.json(result);
};

export const createMechanic = async (req: Request, res: Response) => {
  const result = await mechanicService.createMechanicService(req.body);
  return res.status(201).json(result);
};

export const getMechanics = async (req: Request, res: Response) => {
  const result = await mechanicService.getMechanicsService(req.query as any);
  return res.json(result);
};

export const getMechanicById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.getMechanicByIdService(id);
  return res.json(result);
};

export const getMechanicOverview = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.getMechanicOverviewService(id);
  return res.json(result);
};

export const updateMechanic = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.updateMechanicService(id, req.body);
  return res.json(result);
};

export const updateKyc = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.updateKycService(id, req.body.kyc, req.body.kycStatus);
  return res.json(result);
};

export const deleteMechanic = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await mechanicService.deleteMechanicService(id);
  return res.json(result);
};
