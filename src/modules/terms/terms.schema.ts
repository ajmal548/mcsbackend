import { z } from 'zod';
import { TERMS_STATUS, TERMS_AUDIT_ACTION, TERMS_PAGINATION_DEFAULTS, TermsStatus, TermsAuditAction } from './terms.constants';
import { ITermsAuditChanges } from './termsAuditLog.model';

export const TermsIdParamSchema = z.object({
  id: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid terms ID format'),
});

export const CreateTermsBodySchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(250, 'Title cannot exceed 250 characters'),
  content: z
    .string({ message: 'Content is required' })
    .trim()
    .min(10, 'Content must be at least 10 characters'),
  version: z
    .string({ message: 'Version is required' })
    .trim()
    .min(1, 'Version is required')
    .max(50, 'Version cannot exceed 50 characters'),
  status: z.enum(TERMS_STATUS).default('draft'),
  effectiveDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'effectiveDate must be a valid ISO date string',
    }),
});

export const UpdateTermsBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(250, 'Title cannot exceed 250 characters')
    .optional(),
  content: z
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .optional(),
  version: z
    .string()
    .trim()
    .min(1, 'Version is required')
    .max(50, 'Version cannot exceed 50 characters')
    .optional(),
  status: z.enum(TERMS_STATUS).optional(),
  effectiveDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'effectiveDate must be a valid ISO date string',
    }),
});

export const GetTermsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(TERMS_STATUS).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : TERMS_PAGINATION_DEFAULTS.PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? Math.min(
            TERMS_PAGINATION_DEFAULTS.MAX_LIMIT,
            Math.max(1, parseInt(val, 10) || TERMS_PAGINATION_DEFAULTS.LIMIT)
          )
        : TERMS_PAGINATION_DEFAULTS.LIMIT
    ),
});

export const GetTermsAuditQuerySchema = z.object({
  admin: z.string().trim().optional(),
  action: z.enum(TERMS_AUDIT_ACTION).optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'startDate must be a valid ISO date string',
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'endDate must be a valid ISO date string',
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : TERMS_PAGINATION_DEFAULTS.PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? Math.min(
            TERMS_PAGINATION_DEFAULTS.MAX_LIMIT,
            Math.max(1, parseInt(val, 10) || TERMS_PAGINATION_DEFAULTS.LIMIT)
          )
        : TERMS_PAGINATION_DEFAULTS.LIMIT
    ),
});

// Request wrapper schemas for validateRequest middleware
export const createTermsRequestSchema = z.object({
  body: CreateTermsBodySchema,
});

export const updateTermsRequestSchema = z.object({
  params: TermsIdParamSchema,
  body: UpdateTermsBodySchema,
});

export const getTermsRequestSchema = z.object({
  query: GetTermsQuerySchema,
});

export const getTermsByIdRequestSchema = z.object({
  params: TermsIdParamSchema,
});

export const getTermsAuditRequestSchema = z.object({
  query: GetTermsAuditQuerySchema,
});

export const getTermsByIdAuditRequestSchema = z.object({
  params: TermsIdParamSchema,
  query: GetTermsAuditQuerySchema,
});

// Inferred DTO Types
export type CreateTermsDTO = z.infer<typeof CreateTermsBodySchema>;
export type UpdateTermsDTO = z.infer<typeof UpdateTermsBodySchema>;
export type GetTermsQueryDTO = z.infer<typeof GetTermsQuerySchema>;
export type GetTermsAuditQueryDTO = z.infer<typeof GetTermsAuditQuerySchema>;

// Response DTOs
export interface TermsResponseDTO {
  id: string;
  title: string;
  content: string;
  version: string;
  status: TermsStatus;
  effectiveDate: string;
  createdBy: string;
  updatedBy?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TermsAuditLogResponseDTO {
  id: string;
  action: TermsAuditAction;
  termsId: string;
  adminId?: string;
  adminEmail?: string;
  mechanicId?: string;
  version?: string;
  ip?: string;
  timestamp: string;
  changes?: ITermsAuditChanges;
  createdAt: string;
}

export interface CreateTermsResponseDTO {
  termsCreated: boolean;
  termsId: string;
  status: TermsStatus;
}

export interface UpdateTermsResponseDTO {
  termsUpdated: boolean;
  termsId: string;
  status: TermsStatus;
}

export interface DeleteTermsResponseDTO {
  termsDeleted: boolean;
  termsId: string;
}
