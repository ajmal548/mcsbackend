import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/responseHandlers';

const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === 'ZodError') {
        const errors = (error.issues || error.errors || []).map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : e.path,
          message: e.message,
        }));

        sendError(res, {
          message: 'Validation failed',
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          errors,
          requestId: req.id,
        });
        return;
      }
      next(error);
    }
  };
};

export default validateRequest;
