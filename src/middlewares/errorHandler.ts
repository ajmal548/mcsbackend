import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseHandlers';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const isMulterError = err?.name === 'MulterError';
  const statusCode = err.statusCode || (isMulterError ? 400 : 500);
  const message = err.message || 'Internal Server Error';
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const errors = err.errors || [];
  const requestId = req.id;

  if (process.env.NODE_ENV !== 'test') {
    // Structured error logging
    process.stderr.write(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        requestId,
        path: req.originalUrl,
        method: req.method,
        statusCode,
        message,
        code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      }) + '\n'
    );
  }

  sendError(res, {
    message,
    statusCode,
    code,
    errors,
    requestId,
  });
};

export default errorHandler;
