import { z } from 'zod';

export const createMechanicSchema = z.object({
  body: z.object({
    businessName: z.string({ message: 'Business name is required' }).min(2),
    category: z.string({ message: 'Category is required' }),
    description: z.string({ message: 'Description is required' }).min(10),
    specialties: z.array(z.string()).optional().default([]),
    phone: z.string({ message: 'Phone is required' }),
    city: z.string({ message: 'City is required' }),
    address: z.string({ message: 'Address is required' }),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    is24_7: z.boolean().optional().default(false),
    isMobile: z.boolean().optional().default(false),
    location: z
      .object({
        lat: z.number(),
        long: z.number(),
      })
      .optional(),
  }),
});

export const updateMechanicSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).optional(),
    category: z.string().optional(),
    description: z.string().min(10).optional(),
    specialties: z.array(z.string()).optional(),
    phone: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    is24_7: z.boolean().optional(),
    isMobile: z.boolean().optional(),
    location: z
      .object({
        lat: z.number(),
        long: z.number(),
      })
      .optional(),
  }),
});

export const getMechanicsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
  }),
});
