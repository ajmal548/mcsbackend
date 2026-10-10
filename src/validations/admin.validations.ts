import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email address' }),
    password: z.string({ message: 'Password is required' }),
  }),
});

export const adminCreateSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email address' }),
    password: z.string({ message: 'Password is required' }).min(6, { message: 'Password must be at least 6 characters' }),
  }),
});

export const adminUpdateSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }).optional(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }).optional(),
  }),
});
