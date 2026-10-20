import { Request, Response } from 'express';
import { postService } from './post.service';
import { sendSuccess } from '../../utils/responseHandlers';
import { AuthRequest } from '../../middlewares/jwtVerification';
import {
  CreatePostDTO,
  UpdatePostDTO,
  GetPostsQueryDTO,
} from './post.schema';
import AppError from '../../utils/appError';

/**
 * Controller: Handles post creation, video uploads, feeds, and interactions.
 */
export const uploadMedia = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Media file is required', 400);
  }
  const result = await postService.uploadMedia(req.file);
  return sendSuccess(res, result, 'Media uploaded successfully', 201);
};

export const createPost = async (req: AuthRequest, res: Response) => {
  const mechanicId = req.userId?.toString();
  if (!mechanicId) {
    throw new AppError('Authentication required to create a post', 401);
  }

  const result = await postService.createPost(mechanicId, req.body as CreatePostDTO);
  return sendSuccess(res, result, 'Post published successfully', 201);
};

/**
 * Direct 1-step multipart post creation with media file and text metadata.
 */
export const uploadAndCreatePost = async (req: AuthRequest, res: Response) => {
  const mechanicId = req.userId?.toString();
  if (!mechanicId) {
    throw new AppError('Authentication required to create a post', 401);
  }

  if (!req.file) {
    throw new AppError('Post requires an image or video file', 400);
  }

  if (!req.body.caption || !req.body.caption.trim()) {
    throw new AppError('Caption is required', 400);
  }

  // Upload media
  const uploaded = await postService.uploadMedia(req.file);

  // Parse tags and vehicleInfo if sent as JSON strings in multipart/form-data
  let tags: string[] = [];
  if (req.body.tags) {
    try {
      tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
    } catch {
      tags = req.body.tags.split(',').map((t: string) => t.trim());
    }
  }

  let vehicleInfo = {};
  if (req.body.vehicleInfo) {
    try {
      vehicleInfo = typeof req.body.vehicleInfo === 'string' ? JSON.parse(req.body.vehicleInfo) : req.body.vehicleInfo;
    } catch {
      vehicleInfo = {};
    }
  }

  const postPayload: CreatePostDTO = {
    title: req.body.title || '',
    caption: req.body.caption,
    mediaType: uploaded.type,
    media: [
      {
        url: uploaded.url,
        publicId: uploaded.publicId,
        type: uploaded.type,
        thumbnailUrl: uploaded.thumbnailUrl,
        duration: uploaded.duration,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
      },
    ],
    category: req.body.category || '',
    vehicleInfo,
    tags,
  };

  const result = await postService.createPost(mechanicId, postPayload);
  return sendSuccess(res, result, 'Post published successfully', 201);
};

export const getPosts = async (req: Request, res: Response) => {
  const { items, meta } = await postService.getPosts(req.query as unknown as GetPostsQueryDTO);
  return sendSuccess(res, items, 'Posts retrieved successfully', 200, meta);
};

export const getPostById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await postService.getPostById(id);
  return sendSuccess(res, result, 'Post details retrieved successfully', 200);
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId?.toString() || '';
  const isAdmin = req.role === 'admin';

  const result = await postService.updatePost(id, userId, req.body as UpdatePostDTO, isAdmin);
  return sendSuccess(res, result, 'Post updated successfully', 200);
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId?.toString() || '';
  const isAdmin = req.role === 'admin';

  const result = await postService.deletePost(id, userId, isAdmin);
  return sendSuccess(res, result, 'Post removed successfully', 200);
};

export const recordView = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await postService.recordView(id);
  return sendSuccess(res, result, 'View recorded', 200);
};

export const toggleLike = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const delta = req.body.like === false ? -1 : 1;
  const result = await postService.toggleLike(id, delta);
  return sendSuccess(res, result, 'Like updated', 200);
};
