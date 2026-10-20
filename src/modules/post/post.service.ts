import { Types } from 'mongoose';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/appError';
import { postRepository, PostRepository } from './post.repository';
import { toPostResponseDTO, toPostResponseDTOList } from './post.mapper';
import {
  CreatePostDTO,
  UpdatePostDTO,
  GetPostsQueryDTO,
  PostResponseDTO,
  CreatePostResponseDTO,
  UpdatePostResponseDTO,
  DeletePostResponseDTO,
  UploadMediaResponseDTO,
} from './post.schema';
import { PaginationMeta } from '../../utils/responseHandlers';
import { uploadBufferToCloudinary } from '../../config/cloudinary.config';
import Mechanic from '../../schemas/mechanic.schema';

export class PostService {
  constructor(private readonly repository: PostRepository = postRepository) {}

  /**
   * Upload an image or video buffer to Cloudinary for post creation.
   */
  async uploadMedia(file: Express.Multer.File): Promise<UploadMediaResponseDTO> {
    if (!file || !file.buffer) {
      throw new ValidationError('No file uploaded');
    }

    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    const folder = isVideo ? 'mycarsol/posts/videos' : 'mycarsol/posts/images';

    const result = await uploadBufferToCloudinary(file.buffer, folder, resourceType);

    // If Cloudinary processed a video, generate thumbnail preview URL
    let thumbnailUrl = '';
    if (isVideo) {
      // Cloudinary video thumbnail convention: replace extension with .jpg or use derived secure_url
      thumbnailUrl = result.secure_url.replace(/\.[^/.]+$/, '.jpg');
    } else {
      thumbnailUrl = result.secure_url;
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: isVideo ? 'video' : 'image',
      thumbnailUrl,
      duration: result.duration ? parseFloat(result.duration.toFixed(2)) : undefined,
      format: result.format || file.mimetype.split('/')[1] || '',
      bytes: result.bytes || file.size,
      width: result.width,
      height: result.height,
    };
  }

  /**
   * Create a new post by an authenticated mechanic.
   */
  async createPost(mechanicId: string, dto: CreatePostDTO): Promise<CreatePostResponseDTO> {
    if (!Types.ObjectId.isValid(mechanicId)) {
      throw new ValidationError('Invalid mechanic identifier');
    }

    // Verify mechanic exists and is active
    const mechanic = await Mechanic.findById(mechanicId).select('_id status');
    if (!mechanic) {
      throw new NotFoundError('Mechanic account not found', 'MECHANIC_NOT_FOUND');
    }

    if (mechanic.status === 'inactive') {
      throw new ForbiddenError('Deactivated mechanic accounts cannot publish posts');
    }

    // Determine mediaType automatically from media items if not explicitly set
    const hasImage = dto.media.some((m) => m.type === 'image');
    const hasVideo = dto.media.some((m) => m.type === 'video');
    let computedMediaType: 'image' | 'video' | 'mixed' = dto.mediaType || 'image';

    if (hasImage && hasVideo) {
      computedMediaType = 'mixed';
    } else if (hasVideo) {
      computedMediaType = 'video';
    } else {
      computedMediaType = 'image';
    }

    const created = await this.repository.create({
      mechanicId: new Types.ObjectId(mechanicId),
      title: dto.title || '',
      caption: dto.caption,
      mediaType: computedMediaType,
      media: dto.media as any,
      category: dto.category || '',
      vehicleInfo: dto.vehicleInfo,
      tags: dto.tags || [],
      likesCount: 0,
      viewsCount: 0,
      isDeleted: false,
    });

    return {
      postCreated: true,
      postId: created._id.toString(),
    };
  }

  /**
   * Get paginated post feed for mobile app users and mechanics.
   */
  async getPosts(query: GetPostsQueryDTO): Promise<{
    items: PostResponseDTO[];
    meta: PaginationMeta;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.mechanicId) {
      if (Types.ObjectId.isValid(query.mechanicId)) {
        filter.mechanicId = new Types.ObjectId(query.mechanicId);
      }
    }

    if (query.mediaType) {
      filter.mediaType = query.mediaType;
    }

    if (query.category) {
      filter.category = { $regex: query.category, $options: 'i' };
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { caption: { $regex: query.search, $options: 'i' } },
        { tags: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { items, total } = await this.repository.findPaginated(filter, {
      skip,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      items: toPostResponseDTOList(items),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single post by ID.
   */
  async getPostById(id: string): Promise<PostResponseDTO> {
    const post = await this.repository.findById(id, true);
    if (!post) {
      throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
    }

    return toPostResponseDTO(post);
  }

  /**
   * Update an existing post (restricted to owner mechanic or admin).
   */
  async updatePost(
    id: string,
    userId: string,
    dto: UpdatePostDTO,
    isAdmin: boolean = false
  ): Promise<UpdatePostResponseDTO> {
    const existing = await this.repository.findById(id, false);
    if (!existing) {
      throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
    }

    // Ownership check
    if (!isAdmin && existing.mechanicId.toString() !== userId) {
      throw new ForbiddenError('You can only edit your own posts');
    }

    const updateFields: Record<string, any> = {};
    if (dto.title !== undefined) updateFields.title = dto.title;
    if (dto.caption !== undefined) updateFields.caption = dto.caption;
    if (dto.category !== undefined) updateFields.category = dto.category;
    if (dto.vehicleInfo !== undefined) updateFields.vehicleInfo = dto.vehicleInfo;
    if (dto.tags !== undefined) updateFields.tags = dto.tags;

    if (Object.keys(updateFields).length > 0) {
      await this.repository.atomicUpdate(id, updateFields);
    }

    return { postUpdated: true };
  }

  /**
   * Soft delete a post (restricted to owner mechanic or admin).
   */
  async deletePost(id: string, userId: string, isAdmin: boolean = false): Promise<DeletePostResponseDTO> {
    const existing = await this.repository.findById(id, false);
    if (!existing) {
      throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
    }

    // Ownership check
    if (!isAdmin && existing.mechanicId.toString() !== userId) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await this.repository.softDelete(id);
    return { postDeleted: true };
  }

  /**
   * Record a video or post view.
   */
  async recordView(id: string): Promise<{ viewed: boolean }> {
    const updated = await this.repository.incrementViews(id);
    if (!updated) {
      throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
    }
    return { viewed: true };
  }

  /**
   * Toggle like on a post.
   */
  async toggleLike(id: string, delta: number = 1): Promise<{ liked: boolean }> {
    const updated = await this.repository.updateLikes(id, delta);
    if (!updated) {
      throw new NotFoundError('Post not found', 'POST_NOT_FOUND');
    }
    return { liked: delta > 0 };
  }
}

export const postService = new PostService();
export default postService;
