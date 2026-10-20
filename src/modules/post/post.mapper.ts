import { IPostLean } from './post.model';
import { PostResponseDTO } from './post.schema';

export const toPostResponseDTO = (post: any): PostResponseDTO => {
  const isPopulated = post.mechanicId && typeof post.mechanicId === 'object' && post.mechanicId._id;

  const mechanicIdStr = isPopulated
    ? post.mechanicId._id.toString()
    : post.mechanicId
    ? post.mechanicId.toString()
    : '';

  const mechanicSummary = isPopulated
    ? {
        id: post.mechanicId._id.toString(),
        name: post.mechanicId.name || 'Mechanic',
        profileImage: post.mechanicId.profileImage || null,
        categoryName: post.mechanicId.category?.name || '',
        mobile: post.mechanicId.mobile || '',
      }
    : undefined;

  return {
    id: post._id ? post._id.toString() : '',
    mechanicId: mechanicIdStr,
    ...(mechanicSummary && { mechanic: mechanicSummary }),
    title: post.title || '',
    caption: post.caption || '',
    mediaType: post.mediaType || 'image',
    media: Array.isArray(post.media)
      ? post.media.map((m: any) => ({
          url: m.url,
          publicId: m.publicId || '',
          type: m.type,
          thumbnailUrl: m.thumbnailUrl || '',
          duration: m.duration || 0,
          format: m.format || '',
          bytes: m.bytes || 0,
          width: m.width || 0,
          height: m.height || 0,
        }))
      : [],
    category: post.category || '',
    vehicleInfo: {
      make: post.vehicleInfo?.make || '',
      model: post.vehicleInfo?.model || '',
      year: post.vehicleInfo?.year || null,
    },
    tags: Array.isArray(post.tags) ? post.tags : [],
    likesCount: typeof post.likesCount === 'number' ? post.likesCount : 0,
    viewsCount: typeof post.viewsCount === 'number' ? post.viewsCount : 0,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : new Date(post.createdAt).toISOString(),
    updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : new Date(post.updatedAt).toISOString(),
  };
};

export const toPostResponseDTOList = (posts: any[]): PostResponseDTO[] =>
  posts.map(toPostResponseDTO);
