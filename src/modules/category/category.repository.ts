import { Types } from 'mongoose';
import CategoryModel, { ICategoryLean } from './category.model';

export class CategoryRepository {
  /**
   * Find a non-deleted category by its MongoDB ObjectId.
   */
  async findById(id: string): Promise<ICategoryLean | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return CategoryModel.findOne({ _id: new Types.ObjectId(id), isDeleted: { $ne: true } })
      .lean<ICategoryLean>()
      .exec();
  }

  /**
   * Find a non-deleted category by slug.
   */
  async findBySlug(slug: string): Promise<ICategoryLean | null> {
    return CategoryModel.findOne({ slug, isDeleted: { $ne: true } })
      .lean<ICategoryLean>()
      .exec();
  }

  /**
   * Find a non-deleted category by name or slug (used for uniqueness checks).
   */
  async findByNameOrSlug(name: string, slug: string, excludeId?: string): Promise<ICategoryLean | null> {
    const filter: Record<string, any> = {
      $or: [{ name }, { slug }],
      isDeleted: { $ne: true },
    };

    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    return CategoryModel.findOne(filter).lean<ICategoryLean>().exec();
  }

  /**
   * List non-deleted categories with pagination and filters.
   */
  async findPaginated(
    filter: Record<string, any>,
    options: { skip: number; limit: number; sort?: Record<string, 1 | -1> }
  ): Promise<{ items: ICategoryLean[]; total: number }> {
    const queryFilter = {
      ...filter,
      isDeleted: { $ne: true },
    };

    const [items, total] = await Promise.all([
      CategoryModel.find(queryFilter)
        .sort(options.sort || { createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean<ICategoryLean[]>()
        .exec(),
      CategoryModel.countDocuments(queryFilter).exec(),
    ]);

    return { items, total };
  }

  /**
   * Create a new category and return its lean representation.
   */
  async create(data: Partial<ICategoryLean>): Promise<ICategoryLean> {
    const categoryDoc = new CategoryModel(data);
    const saved = await categoryDoc.save();
    return saved.toObject<ICategoryLean>();
  }

  /**
   * Execute an atomic update on a non-deleted category.
   * Returns true if a document was matched and updated.
   */
  async atomicUpdate(id: string, updateFields: Record<string, any>): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await CategoryModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $set: updateFields }
    ).exec();

    return result.matchedCount > 0;
  }

  /**
   * Execute a soft delete on a category.
   */
  async softDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await CategoryModel.updateOne(
      { _id: new Types.ObjectId(id), isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    ).exec();

    return result.matchedCount > 0;
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
