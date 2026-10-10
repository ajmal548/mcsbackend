import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const isMulterError = err?.name === 'MulterError';
  const statusCode = err.statusCode || (isMulterError ? 400 : 500);
  const status = err.status || (isMulterError ? 'fail' : 'error');

  console.error('Error Stack:', err.stack);

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
