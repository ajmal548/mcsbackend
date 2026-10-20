export const CATEGORY_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  SORT_BY: '-createdAt',
} as const;

export const CATEGORY_PATHS = {
  ROOT: '/categories',
  BASE: '/',
  BY_ID: '/:id',
} as const;

export const CATEGORY_FIELD_TYPES = ['string', 'number', 'boolean', 'select', 'array'] as const;
export type CategoryFieldType = (typeof CATEGORY_FIELD_TYPES)[number];
