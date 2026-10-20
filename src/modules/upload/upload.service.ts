import mongoose from 'mongoose';
import Mechanic from '../../schemas/mechanic.schema';
import AppError from '../../utils/appError';
import { uploadBufferToCloudinary } from '../../config/cloudinary.config';

const ensureMechanic = async (mechanicId?: string) => {
  if (!mechanicId) return null;
  if (!mongoose.Types.ObjectId.isValid(mechanicId)) {
    throw new AppError('Invalid mechanicId', 400);
  }
  const mechanic = await Mechanic.findById(mechanicId).select('_id');
  if (!mechanic) throw new AppError('Mechanic not found', 404);
  return mechanic;
};

/**
 * Upload a profile image. If mechanicId is given, the mechanic's profileImage is updated.
 * Without mechanicId (e.g. during registration) only the URL is returned, to be sent in POST /mechanics.
 */
export const uploadProfileImageService = async (file: Express.Multer.File, mechanicId?: string) => {
  await ensureMechanic(mechanicId);

  const result = await uploadBufferToCloudinary(file.buffer, 'mycarsol/profiles', 'image');

  let mechanic = null;
  if (mechanicId) {
    mechanic = await Mechanic.findByIdAndUpdate(
      mechanicId,
      { $set: { profileImage: result.secure_url } },
      { new: true }
    ).select('-password');
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    mechanic,
  };
};

/**
 * Upload a category certificate (image or PDF). If mechanicId is given, it is saved to
 * mechanic.category.fields.certificate.
 */
export const uploadCertificateService = async (file: Express.Multer.File, mechanicId?: string) => {
  await ensureMechanic(mechanicId);

  const result = await uploadBufferToCloudinary(file.buffer, 'mycarsol/certificates', 'auto');

  const certificate = {
    url: result.secure_url,
    publicId: result.public_id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    uploadedAt: new Date(),
  };

  let mechanic = null;
  if (mechanicId) {
    mechanic = await Mechanic.findByIdAndUpdate(
      mechanicId,
      { $set: { 'category.fields.certificate': certificate } },
      { new: true }
    ).select('-password');
  }

  return { ...certificate, mechanic };
};

export const deleteUploadedFileService = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) => {
  if (!publicId || !publicId.trim()) {
    throw new AppError('publicId is required to delete an uploaded file', 400);
  }
  const { deleteFromCloudinary } = await import('../../config/cloudinary.config');
  const result = await deleteFromCloudinary(publicId.trim(), resourceType);
  return { fileDeleted: true, publicId: publicId.trim(), result };
};
