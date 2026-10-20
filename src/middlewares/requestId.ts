import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'] as string | undefined;
  const requestId = incomingId || randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

export default requestIdMiddleware;
