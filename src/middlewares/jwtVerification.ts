import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Admin from '../schemas/admin.schema';
import Mechanic from '../schemas/mechanic.schema';
import RefreshToken from '../schemas/refreshtoken.schema';
import AppError from '../utils/appError';
import { generateToken } from '../utils/helpers';

export interface AuthRequest extends Request {
  admin?: any;
  mechanic?: any;
  user?: any;
  userId?: any;
  role?: string;
}

const secretKey = process.env.JWT_SECRET || 'secret123';

export const verifyMechanic = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing', 401));
  }

  const token = authHeader.split(' ')[1];
  let verifiedToken: any;

  try {
    verifiedToken = jwt.verify(token, secretKey);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      try {
        verifiedToken = jwt.verify(token, secretKey, { ignoreExpiration: true });
      } catch {
        return next(new AppError('Not authorized, token failed', 401));
      }
    } else {
      return next(new AppError('Not authorized to access this route', 401));
    }
  }

  const targetId = verifiedToken.id || verifiedToken.userId;
  const mechanic = await Mechanic.findById(targetId);

  if (!mechanic) {
    return next(new AppError('Mechanic not found', 404));
  }

  if (
    verifiedToken.accessTokenVersion !== undefined &&
    mechanic.accessTokenVersion !== undefined &&
    verifiedToken.accessTokenVersion !== mechanic.accessTokenVersion
  ) {
    return next(new AppError('Token has been revoked. Please login again.', 401));
  }

  // Auto-renew token if expiring in less than 5 minutes (300 seconds)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = verifiedToken.exp - currentTime;

  if (timeRemaining < 300) {
    const activeRefreshToken = await RefreshToken.findOne({
      userId: mechanic._id,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!activeRefreshToken) {
      if (timeRemaining < 0) {
        return next(new AppError('Session expired. Please login again.', 401));
      }
    } else {
      const payload = {
        id: mechanic._id,
        userId: mechanic._id,
        email: mechanic.email,
        role: 'mechanic',
        accessTokenVersion: mechanic.accessTokenVersion || 0,
      };
      const newToken = generateToken(payload, '30m');
      res.setHeader('x-renewed-token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'x-renewed-token');
    }
  }

  req.userId = mechanic._id;
  req.mechanic = mechanic;
  req.user = mechanic;
  req.role = 'mechanic';
  next();
};

export const verifyAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing', 401));
  }

  const token = authHeader.split(' ')[1];
  let verifiedToken: any;

  try {
    verifiedToken = jwt.verify(token, secretKey);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      try {
        verifiedToken = jwt.verify(token, secretKey, { ignoreExpiration: true });
      } catch {
        return next(new AppError('Not authorized, token failed', 401));
      }
    } else {
      return next(new AppError('Not authorized to access this route', 401));
    }
  }

  const targetId = verifiedToken.id || verifiedToken.userId || verifiedToken.adminId;
  const admin = await Admin.findById(targetId).select('-password');

  if (!admin) {
    return next(new AppError('Admin user not found', 401));
  }

  if (
    verifiedToken.accessTokenVersion !== undefined &&
    admin.accessTokenVersion !== undefined &&
    verifiedToken.accessTokenVersion !== admin.accessTokenVersion
  ) {
    return next(new AppError('Token has been revoked. Please login again.', 401));
  }

  // Auto-renew token if expiring in less than 5 minutes (300 seconds)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = verifiedToken.exp - currentTime;

  if (timeRemaining < 300) {
    const activeRefreshToken = await RefreshToken.findOne({
      userId: admin._id,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!activeRefreshToken) {
      if (timeRemaining < 0) {
        return next(new AppError('Session expired. Please login again.', 401));
      }
    } else {
      const payload = {
        id: admin._id,
        userId: admin._id,
        email: admin.email,
        role: 'admin',
        accessTokenVersion: admin.accessTokenVersion || 0,
      };
      const newToken = generateToken(payload, '30m');
      res.setHeader('x-renewed-token', newToken);
      res.setHeader('Access-Control-Expose-Headers', 'x-renewed-token');
    }
  }

  req.admin = admin;
  req.user = admin;
  req.userId = admin._id;
  req.role = 'admin';
  next();
};

export const verifyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.decode(token);
    if (decoded?.role === 'admin') {
      return verifyAdmin(req, res, next);
    }
    return verifyMechanic(req, res, next);
  } catch {
    return next(new AppError('Invalid token format', 401));
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.decode(token);
    if (!decoded) return next();

    if (decoded?.role === 'admin') {
      return verifyAdmin(req, res, (err?: any) => {
        if (err) {
          req.admin = undefined;
          req.user = undefined;
        }
        next();
      });
    }

    return verifyMechanic(req, res, (err?: any) => {
      if (err) {
        req.mechanic = undefined;
        req.user = undefined;
      }
      next();
    });
  } catch {
    return next();
  }
};

export const verifySelfOrAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return verifyAuth(req, res, (err?: any) => {
    if (err) return next(err);

    const targetId = req.params.id;
    const isSelf = targetId && req.userId && req.userId.toString() === targetId.toString();
    const isAdmin = req.role === 'admin';

    if (isSelf || isAdmin) {
      return next();
    }

    return next(new AppError('Forbidden: You can only access or modify your own mechanic account', 403));
  });
};

