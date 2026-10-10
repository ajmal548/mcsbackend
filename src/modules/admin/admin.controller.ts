import { Request, Response } from 'express';
import * as adminService from './admin.service';

export const login = async (req: Request, res: Response) => {
  const result = await adminService.loginAdmin(req.body);
  return res.json(result);
};

export const register = async (req: Request, res: Response) => {
  const result = await adminService.registerAdmin(req.body);
  return res.status(201).json(result);
};

export const getAdmins = async (req: Request, res: Response) => {
  const result = await adminService.getAllAdmins();
  return res.json(result);
};

export const getAdminById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await adminService.getAdminByIdService(id);
  return res.json(result);
};

export const updateAdmin = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await adminService.updateAdminService(id, req.body);
  return res.json(result);
};

export const deleteAdmin = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await adminService.deleteAdminService(id);
  return res.json(result);
};
