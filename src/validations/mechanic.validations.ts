import { z } from 'zod';

const kycDocSchema = z.object({
  documentType: z.enum(['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Other']),
  documentNumber: z.string().optional(),
  documentUrl: z.string({ message: 'Document URL is required' }),
  frontUrl: z.string().optional(),
  backUrl: z.string().optional(),
  isVerified: z.boolean().optional().default(false),
});

const addressSchema = z.object({
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  fullAddress: z.string({ message: 'Full address is required' }),
});

const categorySelectionSchema = z.object({
  id: z.string({ message: 'Category ID is required' }),
  name: z.string({ message: 'Category Name is required' }),
  fields: z.record(z.string(), z.any()).optional().default({}),
});

const subCategorySelectionSchema = z.object({
  id: z.string().optional(),
  name: z.string({ message: 'SubCategory Name is required' }),
  fields: z.record(z.string(), z.any()).optional().default({}),
});

export const mechanicLoginSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    mobile: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' })
      .optional(),
    password: z.string({ message: 'Password is required' }).min(1, { message: 'Password is required' }),
  }).refine((data) => !!(data.email || data.mobile), {
    message: 'Either email or mobile number is required',
    path: ['email'],
  }),
});


export const createMechanicSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(2),
    email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email address' }),
    mobile: z
      .string({ message: 'Mobile number is required' })
      .trim()
      .regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' }),
    password: z.string({ message: 'Password is required' }).min(6, { message: 'Password must be at least 6 characters' }),
    profileImage: z.string().optional(),

    category: categorySelectionSchema,
    subCategory: z.array(subCategorySelectionSchema).optional().default([]),

    address: addressSchema,
    location: z
      .union([
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        z.object({
          lat: z.number().min(-90).max(90),
          long: z.number().min(-180).max(180),
        }),
        z.object({
          type: z.literal('Point').default('Point'),
          coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
        }),
      ])
      .optional(),

    kyc: z.array(kycDocSchema).optional().default([]),
    kycStatus: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
    radius: z.number().min(1).max(100).optional().default(5),
    status: z.enum(['pending', 'approved', 'rejected', 'active', 'inactive', 'verified']).optional().default('pending'),
    termsId: z.string({ message: 'termsId is required' }).min(1, 'termsId is required'),
    termsVersion: z.string({ message: 'termsVersion is required' }).min(1, 'termsVersion is required'),
    accepted: z.boolean({ message: 'accepted is required' }).refine((val) => val === true, {
      message: 'You must accept the Terms & Conditions to complete registration',
    }),
  }),
});

export const updateMechanicSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    mobile: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' })
      .optional(),
    password: z.string().min(6).optional(),
    profileImage: z.string().optional(),

    category: categorySelectionSchema.partial().optional(),
    subCategory: z.array(subCategorySelectionSchema).optional(),

    address: addressSchema.partial().optional(),
    location: z
      .union([
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        z.object({
          lat: z.number().min(-90).max(90),
          long: z.number().min(-180).max(180),
        }),
        z.object({
          type: z.literal('Point').default('Point'),
          coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
        }),
      ])
      .optional(),

    kyc: z.array(kycDocSchema).optional(),
    kycStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    radius: z.number().min(1).max(100).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'active', 'inactive', 'verified']).optional(),
    termsAccepted: z.boolean().optional(),
  }),
});

export const updateKycSchema = z.object({
  body: z
    .object({
      kyc: z.array(kycDocSchema).optional(),
      kycStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    })
    .refine((data) => (data.kyc && data.kyc.length > 0) || data.kycStatus !== undefined, {
      message: 'Either KYC documents or KYC status must be provided',
    }),
});

export const deleteKycSchema = z.object({
  query: z.object({
    documentType: z.string().optional(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z
      .number({ message: 'Latitude is required' })
      .min(-90, { message: 'Latitude must be between -90 and 90' })
      .max(90, { message: 'Latitude must be between -90 and 90' }),
    longitude: z
      .number({ message: 'Longitude is required' })
      .min(-180, { message: 'Longitude must be between -180 and 180' })
      .max(180, { message: 'Longitude must be between -180 and 180' }),
  }),
});

export const getNearbyMechanicsSchema = z.object({
  query: z.object({
    lat: z
      .string({ message: 'Latitude (lat) is required' })
      .refine((val) => !isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90, {
        message: 'lat must be a valid latitude between -90 and 90',
      }),
    lng: z
      .string({ message: 'Longitude (lng) is required' })
      .refine((val) => !isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180, {
        message: 'lng must be a valid longitude between -180 and 180',
      }),
    radius: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
        message: 'radius must be a positive number in meters',
      }),
  }),
});

export const getMechanicsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const acceptTermsSchema = z.object({
  body: z.object({
    termsAccepted: z.boolean({ message: 'termsAccepted boolean is required' }).refine((val) => val === true, {
      message: 'termsAccepted must be true to agree to Terms and Conditions',
    }),
    version: z.string().optional(),
  }),
});

