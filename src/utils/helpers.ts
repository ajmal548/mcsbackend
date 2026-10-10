import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export const generateToken = (payload: object, expiresIn: SignOptions['expiresIn'] = '30d'): string => {
  const secret: Secret = process.env.JWT_SECRET || 'secret123';
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string, options?: jwt.VerifyOptions): any => {
  const secret: Secret = process.env.JWT_SECRET || 'secret123';
  return jwt.verify(token, secret, options);
};

export const generateAndSaveToken = async (
  user: any,
  role: 'mechanic' | 'admin' | 'user' = 'mechanic'
): Promise<{ accessToken: string; refreshToken: string }> => {
  const RefreshToken = (await import('../schemas/refreshtoken.schema')).default;

  const accessPayload = {
    id: user._id,
    userId: user._id,
    email: user.email,
    role,
    accessTokenVersion: user.accessTokenVersion || 0,
  };
  const accessToken = generateToken(accessPayload, '30m');

  const refreshPayload = {
    id: user._id,
    userId: user._id,
    email: user.email,
    role,
    tokenVersion: user.tokenVersion || 0,
  };
  const refreshTokenStr = generateToken(refreshPayload, '60d');
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

  await RefreshToken.create({
    userId: user._id,
    role,
    refreshToken: refreshTokenStr,
    expiresAt,
  });

  return { accessToken, refreshToken: refreshTokenStr };
};

export const compareHash = async (plainText: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(plainText, hash);
};

export const handleError = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
