import { Response } from 'express';
import AppError from './appError';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StandardSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface StandardErrorEnvelope {
  success: false;
  message: string;
  code?: string;
  errors?: any[];
  requestId?: string;
}

/**
 * Dispatches a standard success response envelope.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200,
  meta?: PaginationMeta
) => {
  const payload: StandardSuccessEnvelope<T> = {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(payload);
};

/**
 * Dispatches a standard error response envelope.
 */
export const sendError = (
  res: Response,
  options: {
    message: string;
    statusCode?: number;
    code?: string;
    errors?: any[];
    requestId?: string;
  }
) => {
  const { message, statusCode = 400, code, errors = [], requestId } = options;
  const payload: StandardErrorEnvelope = {
    success: false,
    message,
    ...(code && { code }),
    ...(errors.length > 0 && { errors }),
    ...(requestId && { requestId }),
  };
  return res.status(statusCode).json(payload);
};

/**
 * Backward compatibility helper for existing callers.
 * Wraps payload inside standard envelope.
 */
export const sendResponse = (res: Response, data: any = {}, statusCode: number = 200) => {
  return sendSuccess(res, data, 'Success', statusCode);
};

export const sendFailResponse = (message: string, statusCode: number = 400): never => {
  throw new AppError(message, statusCode);
};
