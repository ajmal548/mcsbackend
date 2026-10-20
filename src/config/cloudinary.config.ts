import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import AppError from '../utils/appError';

let configured = false;

// Configure lazily so dotenv has definitely loaded before we read env vars
const getCloudinary = () => {
  if (!configured) {
    const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
      });
      configured = true;
    } else if (CLOUDINARY_URL) {
      cloudinary.config(true); // Forces SDK to parse process.env.CLOUDINARY_URL
      configured = true;
    } else {
      throw new AppError('Cloudinary is not configured. Check CLOUDINARY_* env variables.', 500);
    }
  }
  return cloudinary;
};

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<UploadApiResponse> => {
  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          return reject(new AppError(error?.message || 'Cloudinary upload failed', 502));
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) => {
  const client = getCloudinary();
  return client.uploader.destroy(publicId, { resource_type: resourceType });
};
