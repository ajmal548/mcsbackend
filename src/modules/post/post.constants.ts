export const POST_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: '-createdAt',
} as const;

export const POST_PATHS = {
  ROOT: '/posts',
  BASE: '/',
  FEED: '/feed',
  BY_ID: '/:id',
  LIKE: '/:id/like',
  VIEW: '/:id/view',
  UPLOAD: '/upload',
} as const;

export const POST_MEDIA_TYPE = ['image', 'video', 'mixed'] as const;
export type PostMediaType = (typeof POST_MEDIA_TYPE)[number];
