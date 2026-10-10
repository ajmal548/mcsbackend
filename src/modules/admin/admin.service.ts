import Admin from '../../schemas/admin.schema';
import AppError from '../../utils/appError';
import { generateToken, generateAndSaveToken } from '../../utils/helpers';

export const loginAdmin = async (adminData: { email: string; password?: string }) => {
  const { email, password } = adminData;

  const admin = await Admin.findOne({ email });
  if (!admin || !password || !(await admin.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = await generateAndSaveToken(admin, 'admin');

  return {
    _id: admin._id,
    email: admin.email,
    accessToken,
    refreshToken,
    token: accessToken,
  };
};

export const registerAdmin = async (adminData: { email: string; password?: string }) => {
  const { email, password } = adminData;

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    throw new AppError('Admin already exists with this email', 400);
  }

  const admin = new Admin({ email, password });
  await admin.save();

  return {
    _id: admin._id,
    email: admin.email,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

export const getAllAdmins = async () => {
  return await Admin.find().select('-password').sort({ createdAt: -1 });
};

export const getAdminByIdService = async (id: string) => {
  const admin = await Admin.findById(id).select('-password');
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  return admin;
};

export const updateAdminService = async (id: string, updateData: { email?: string; password?: string }) => {
  const { email, password } = updateData;

  const admin = await Admin.findById(id);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  if (email && email !== admin.email) {
    const emailExists = await Admin.findOne({ email });
    if (emailExists) {
      throw new AppError('Email is already in use by another admin', 400);
    }
    admin.email = email;
  }

  if (password) {
    admin.password = password;
  }

  await admin.save();

  return {
    _id: admin._id,
    email: admin.email,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

export const deleteAdminService = async (id: string) => {
  const admin = await Admin.findByIdAndDelete(id);
  if (!admin) {
    throw new AppError('Admin not found', 404);
  }
  return { message: 'Admin removed successfully' };
};
