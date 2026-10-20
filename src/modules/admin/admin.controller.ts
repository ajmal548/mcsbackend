import { Request, Response } from 'express';
import * as adminService from './admin.service';
import { sendSuccess } from '../../utils/responseHandlers';

export const login = async (req: Request, res: Response) => {
  const result = await adminService.loginAdmin(req.body);
  return sendSuccess(res, result, 'Admin login successful', 200);
};

export const register = async (req: Request, res: Response) => {
  const result = await adminService.registerAdmin(req.body);
  return sendSuccess(res, result, 'Admin registered successfully', 201);
};

export const getAdmins = async (req: Request, res: Response) => {
  const result = await adminService.getAllAdmins();
  return sendSuccess(res, result, 'Admins retrieved successfully', 200);
};

export const getAdminById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await adminService.getAdminByIdService(id);
  return sendSuccess(res, result, 'Admin retrieved successfully', 200);
};

export const updateAdmin = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await adminService.updateAdminService(id, req.body);
  return sendSuccess(res, result, 'Admin updated successfully', 200);
};

export const deleteAdmin = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await adminService.deleteAdminService(id);
  return sendSuccess(res, result, 'Admin removed successfully', 200);
};
