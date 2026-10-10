import { z } from 'zod';

const categoryFieldSchema = z.object({
  name: z.string({ message: 'Field name is required' }),
  label: z.string({ message: 'Field label is required' }),
  type: z.enum(['string', 'number', 'boolean', 'select', 'array']),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional().default([]),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ message: 'Category name is required' }).min(2),
    slug: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    types: z.array(z.string()).optional().default([]),
    fields: z.array(categoryFieldSchema).optional().default([]),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    types: z.array(z.string()).optional(),
    fields: z.array(categoryFieldSchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCategoriesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isActive: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
