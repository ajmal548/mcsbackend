import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

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
        res.status(400).json({
          status: 'fail',
          message: 'Validation failed',
          errors: error.errors
            ? error.errors.map((e: any) => ({
                field: e.path.join('.'),
                message: e.message,
              }))
            : error.issues,
        });
        return;
      }
      next(error);
    }
  };
};

export default validateRequest;
