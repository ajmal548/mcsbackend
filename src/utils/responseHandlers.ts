import { Response } from 'express';
import AppError from './appError';

export const sendResponse = (res: Response, data: any = {}, statusCode: number = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
  });
};

export const sendFailResponse = (message: string, statusCode: number = 400): never => {
  throw new AppError(message, statusCode);
};
