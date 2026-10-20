export const TERMS_STATUS = ['draft', 'published', 'archived'] as const;
export type TermsStatus = (typeof TERMS_STATUS)[number];

export const TERMS_AUDIT_ACTION = ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ACCEPT'] as const;
export type TermsAuditAction = (typeof TERMS_AUDIT_ACTION)[number];

export const TERMS_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: '-createdAt',
} as const;

export const TERMS_PATHS = {
  PUBLIC_ROOT: '/terms',
  ADMIN_ROOT: '/admin/terms',
  ACTIVE: '/active',
  BASE: '/',
  AUDIT: '/audit',
  BY_ID: '/:id',
  BY_ID_AUDIT: '/:id/audit',
} as const;
