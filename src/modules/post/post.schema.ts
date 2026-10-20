import { z } from 'zod';
import { POST_MEDIA_TYPE, POST_PAGINATION_DEFAULTS } from './post.constants';

export const PostMediaItemDtoSchema = z.object({
  url: z.string().trim().min(1, 'Media URL is required'),
  publicId: z.string().trim().optional(),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().trim().optional(),
  duration: z.number().nonnegative().optional(),
  format: z.string().trim().optional(),
  bytes: z.number().nonnegative().optional(),
  width: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
});

export const VehicleInfoDtoSchema = z.object({
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional().nullable(),
});

export const CreatePostBodySchema = z.object({
  title: z.string().trim().max(150, 'Title cannot exceed 150 characters').optional().default(''),
  caption: z.string({ message: 'Caption is required' }).trim().min(1, 'Caption cannot be empty').max(3000),
  mediaType: z.enum(POST_MEDIA_TYPE).default('image'),
  media: z.array(PostMediaItemDtoSchema).min(1, 'At least one media item (image or video) is required'),
  category: z.string().trim().optional().default(''),
  vehicleInfo: VehicleInfoDtoSchema.optional().default(() => ({})),
  tags: z.array(z.string().trim()).optional().default([]),
});

export const UpdatePostBodySchema = z.object({
  title: z.string().trim().max(150).optional(),
  caption: z.string().trim().min(1).max(3000).optional(),
  category: z.string().trim().optional(),
  vehicleInfo: VehicleInfoDtoSchema.optional(),
  tags: z.array(z.string().trim()).optional(),
});

export const GetPostsQuerySchema = z.object({
  mechanicId: z.string().trim().optional(),
  mediaType: z.enum(POST_MEDIA_TYPE).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : POST_PAGINATION_DEFAULTS.PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? Math.min(POST_PAGINATION_DEFAULTS.MAX_LIMIT, Math.max(1, parseInt(val, 10) || POST_PAGINATION_DEFAULTS.LIMIT))
        : POST_PAGINATION_DEFAULTS.LIMIT
    ),
});

export const PostIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Post ID is required'),
});

// Request wrapper schemas for validateRequest middleware
export const createPostRequestSchema = z.object({
  body: CreatePostBodySchema,
});

export const updatePostRequestSchema = z.object({
  params: PostIdParamSchema,
  body: UpdatePostBodySchema,
});

export const getPostsRequestSchema = z.object({
  query: GetPostsQuerySchema,
});

export const getPostByIdRequestSchema = z.object({
  params: PostIdParamSchema,
});

// TypeScript DTOs
export type CreatePostDTO = z.infer<typeof CreatePostBodySchema>;
export type UpdatePostDTO = z.infer<typeof UpdatePostBodySchema>;
export type GetPostsQueryDTO = z.infer<typeof GetPostsQuerySchema>;
export type PostMediaItemDTO = z.infer<typeof PostMediaItemDtoSchema>;

// Response DTO types
export interface PostMechanicSummaryDTO {
  id: string;
  name: string;
  profileImage: string | null;
  categoryName?: string;
  mobile?: string;
}

export interface PostResponseDTO {
  id: string;
  mechanicId: string;
  mechanic?: PostMechanicSummaryDTO;
  title: string;
  caption: string;
  mediaType: string;
  media: PostMediaItemDTO[];
  category: string;
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: number | null;
  };
  tags: string[];
  likesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostResponseDTO {
  postCreated: true;
  postId: string;
}

export interface UpdatePostResponseDTO {
  postUpdated: true;
}

export interface DeletePostResponseDTO {
  postDeleted: true;
}

export interface UploadMediaResponseDTO {
  url: string;
  publicId: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  duration?: number;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}
