import { Types } from 'mongoose';
import PostModel, { IPostLean } from './post.model';

export class PostRepository {
  /**
   * Find a single post by ID with optional mechanic details populated.
   */
  async findById(id: string, populateMechanic: boolean = true): Promise<any | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    let query = PostModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } });

    if (populateMechanic) {
      query = query.populate('mechanicId', 'name profileImage category mobile') as any;
    }

    return query.lean().exec();
  }

  /**
   * List posts for mobile app feed with pagination, search, and category filters.
   */
  async findPaginated(
    filter: Record<string, any>,
    options: { skip: number; limit: number; sort?: Record<string, 1 | -1> }
  ): Promise<{ items: any[]; total: number }> {
    const queryFilter = {
      ...filter,
      isDeleted: { $ne: true },
    };

    const [items, total] = await Promise.all([
      PostModel.find(queryFilter)
        .populate('mechanicId', 'name profileImage category mobile')
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean()
        .exec(),
      PostModel.countDocuments(queryFilter).exec(),
    ]);

    return { items, total };
  }

  /**
   * Create a new post.
   */
  async create(data: Partial<IPostLean>): Promise<IPostLean> {
    const postDoc = new PostModel(data);
    const saved = await postDoc.save();
    return saved.toObject<IPostLean>();
  }

  /**
   * Atomic update of post fields.
   */
  async atomicUpdate(id: string, updateFields: Record<string, any>): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await PostModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $set: updateFields }
    ).exec();

    return result.matchedCount > 0;
  }

  /**
   * Atomically increment post view count.
   */
  async incrementViews(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await PostModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $inc: { viewsCount: 1 } }
    ).exec();

    return result.matchedCount > 0;
  }

  /**
   * Atomically increment/decrement like count.
   */
  async updateLikes(id: string, delta: number): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await PostModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $inc: { likesCount: delta } }
    ).exec();

    return result.matchedCount > 0;
  }

  /**
   * Soft delete a post.
   */
  async softDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await PostModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    ).exec();

    return result.matchedCount > 0;
  }
}

export const postRepository = new PostRepository();
export default postRepository;
