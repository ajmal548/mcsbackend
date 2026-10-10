import jwt from 'jsonwebtoken';
import RefreshToken from '../../schemas/refreshtoken.schema';
import Mechanic from '../../schemas/mechanic.schema';
import Admin from '../../schemas/admin.schema';
import AppError from '../../utils/appError';
import { generateToken } from '../../utils/helpers';

export interface RenewTokenInput {
  currentRefreshToken: string;
  currentAccessToken: string;
  role?: 'mechanic' | 'admin' | 'user';
}

export const renewTokenService = async (data: RenewTokenInput) => {
  const { currentRefreshToken, currentAccessToken, role = 'mechanic' } = data;

  if (!currentRefreshToken || !currentAccessToken) {
    throw new AppError('Refresh token and access token are required', 400);
  }

  const storedToken = await RefreshToken.findOne({ refreshToken: currentRefreshToken });
  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token. Please login again.', 401);
  }

  const decodedAccess: any = jwt.decode(currentAccessToken);
  if (!decodedAccess) {
    throw new AppError('Invalid access token', 400);
  }

  const targetId = decodedAccess.id || decodedAccess.userId || decodedAccess.adminId;
  let userOrAdmin: any;

  if (role === 'mechanic' || role === 'user') {
    userOrAdmin = await Mechanic.findById(targetId);
  } else if (role === 'admin') {
    userOrAdmin = await Admin.findById(targetId);
  } else {
    throw new AppError('Invalid role', 400);
  }

  if (!userOrAdmin) {
    throw new AppError('User or admin not found', 401);
  }

  const currentVersion = userOrAdmin.accessTokenVersion || 0;
  const decodedVersion = decodedAccess.accessTokenVersion || 0;

  if (decodedVersion !== currentVersion) {
    storedToken.revoked = true;
    await storedToken.save();
    throw new AppError('Session revoked. Please login again.', 401);
  }

  // Delete consumed refresh token
  await RefreshToken.findByIdAndDelete(storedToken._id);

  // Increment accessTokenVersion
  userOrAdmin.accessTokenVersion = currentVersion + 1;
  await userOrAdmin.save();

  const accessPayload: any = {
    id: userOrAdmin._id,
    userId: userOrAdmin._id,
    email: userOrAdmin.email,
    role,
    accessTokenVersion: userOrAdmin.accessTokenVersion,
  };

  const refreshPayload: any = {
    id: userOrAdmin._id,
    userId: userOrAdmin._id,
    email: userOrAdmin.email,
    role,
    tokenVersion: userOrAdmin.tokenVersion || 0,
  };

  const newAccessToken = generateToken(accessPayload, '30m');
  const newRefreshToken = generateToken(refreshPayload, '60d');
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: userOrAdmin._id,
    role,
    refreshToken: newRefreshToken,
    expiresAt,
  });

  return {
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutService = async (userId: string) => {
  if (userId) {
    await RefreshToken.deleteMany({ userId });
  }
  return { message: 'Logged out successfully' };
};
