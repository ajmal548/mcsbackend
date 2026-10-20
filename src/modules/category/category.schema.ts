import { z } from 'zod';
import { CATEGORY_FIELD_TYPES, CATEGORY_PAGINATION_DEFAULTS } from './category.constants';

export const CategoryFieldDtoSchema = z.object({
  name: z.string().trim().min(1, 'Field name is required'),
  label: z.string().trim().min(1, 'Field label is required'),
  type: z.enum(CATEGORY_FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().trim()).default([]),
});

export const CreateCategoryBodySchema = z.object({
  name: z.string({ message: 'Category name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  types: z.array(z.string().trim()).default([]),
  fields: z.array(CategoryFieldDtoSchema).default([]),
  isActive: z.boolean().default(true),
});

export const UpdateCategoryBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  types: z.array(z.string().trim()).optional(),
  fields: z.array(CategoryFieldDtoSchema).optional(),
  isActive: z.boolean().optional(),
});

export const GetCategoriesQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val !== undefined ? val === 'true' : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : CATEGORY_PAGINATION_DEFAULTS.PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? Math.min(CATEGORY_PAGINATION_DEFAULTS.MAX_LIMIT, Math.max(1, parseInt(val, 10) || CATEGORY_PAGINATION_DEFAULTS.LIMIT))
        : CATEGORY_PAGINATION_DEFAULTS.LIMIT
    ),
});

export const CategoryIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Category identifier is required'),
});

// Middleware request schemas
export const createCategoryRequestSchema = z.object({
  body: CreateCategoryBodySchema,
});

export const updateCategoryRequestSchema = z.object({
  params: CategoryIdParamSchema,
  body: UpdateCategoryBodySchema,
});

export const getCategoriesRequestSchema = z.object({
  query: GetCategoriesQuerySchema,
});

export const getCategoryByIdRequestSchema = z.object({
  params: CategoryIdParamSchema,
});

// Inferred TypeScript DTOs
export type CreateCategoryDTO = z.infer<typeof CreateCategoryBodySchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategoryBodySchema>;
export type GetCategoriesQueryDTO = z.infer<typeof GetCategoriesQuerySchema>;

// Response DTO types
export interface CategoryResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  types: string[];
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryResponseDTO {
  categoryCreated: true;
  categoryId: string;
}

export interface UpdateCategoryResponseDTO {
  categoryUpdated: true;
}

export interface DeleteCategoryResponseDTO {
  categoryDeleted: true;
}
