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
      .object({
        lat: z.number(),
        long: z.number(),
      })
      .optional(),

    kyc: z.array(kycDocSchema).optional().default([]),
    kycStatus: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
    radius: z.number().min(1).max(100).optional().default(5),
    status: z.enum(['pending', 'approved', 'rejected', 'active', 'inactive']).optional().default('pending'),
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
      .object({
        lat: z.number(),
        long: z.number(),
      })
      .optional(),

    kyc: z.array(kycDocSchema).optional(),
    kycStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    radius: z.number().min(1).max(100).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'active', 'inactive']).optional(),
  }),
});

export const updateKycSchema = z.object({
  body: z.object({
    kyc: z.array(kycDocSchema).min(1, { message: 'At least one valid KYC document is required' }),
    kycStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
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
