import { ConflictError, NotFoundError } from '../../utils/appError';
import { categoryRepository, CategoryRepository } from './category.repository';
import { toCategoryResponseDTO, toCategoryResponseDTOList } from './category.mapper';
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  GetCategoriesQueryDTO,
  CategoryResponseDTO,
  CreateCategoryResponseDTO,
  UpdateCategoryResponseDTO,
  DeleteCategoryResponseDTO,
} from './category.schema';
import { PaginationMeta } from '../../utils/responseHandlers';

export class CategoryService {
  constructor(private readonly repository: CategoryRepository = categoryRepository) {}

  /**
   * Generates a URL-friendly slug from text.
   */
  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  /**
   * Creates a new category after validating name and slug uniqueness.
   */
  async createCategory(dto: CreateCategoryDTO): Promise<CreateCategoryResponseDTO> {
    const slug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.name);

    // Business rule: Uniqueness check
    const existing = await this.repository.findByNameOrSlug(dto.name, slug);
    if (existing) {
      throw new ConflictError('Category with this name or slug already exists', 'CATEGORY_ALREADY_EXISTS');
    }

    const created = await this.repository.create({
      ...dto,
      slug,
      isDeleted: false,
    });

    return {
      categoryCreated: true,
      categoryId: created._id.toString(),
    };
  }

  /**
   * Retrieves paginated list of categories with optional search and active status filter.
   */
  async getCategories(query: GetCategoriesQueryDTO): Promise<{
    items: CategoryResponseDTO[];
    meta: PaginationMeta;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { types: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const { items, total } = await this.repository.findPaginated(filter, {
      skip,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      items: toCategoryResponseDTOList(items),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves a single category by ObjectId or slug.
   */
  async getCategoryByIdOrSlug(idOrSlug: string): Promise<CategoryResponseDTO> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const category = isObjectId
      ? await this.repository.findById(idOrSlug)
      : await this.repository.findBySlug(idOrSlug);

    if (!category) {
      throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    }

    return toCategoryResponseDTO(category);
  }

  /**
   * Pattern B: Lean query + validate + atomic update.
   */
  async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<UpdateCategoryResponseDTO> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    }

    const updateFields: Record<string, any> = {};

    // Validate name & slug uniqueness if changed
    if (dto.name && dto.name !== existing.name) {
      const newSlug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.name);
      const duplicate = await this.repository.findByNameOrSlug(dto.name, newSlug, id);
      if (duplicate) {
        throw new ConflictError('Category with this name or slug already exists', 'CATEGORY_ALREADY_EXISTS');
      }
      updateFields.name = dto.name;
      updateFields.slug = newSlug;
    } else if (dto.slug && dto.slug !== existing.slug) {
      const newSlug = this.generateSlug(dto.slug);
      const duplicate = await this.repository.findBySlug(newSlug);
      if (duplicate && duplicate._id.toString() !== id) {
        throw new ConflictError('Category with this slug already exists', 'CATEGORY_ALREADY_EXISTS');
      }
      updateFields.slug = newSlug;
    }

    if (dto.description !== undefined) updateFields.description = dto.description;
    if (dto.icon !== undefined) updateFields.icon = dto.icon;
    if (dto.types !== undefined) updateFields.types = dto.types;
    if (dto.fields !== undefined) updateFields.fields = dto.fields;
    if (dto.isActive !== undefined) updateFields.isActive = dto.isActive;

    if (Object.keys(updateFields).length > 0) {
      const updated = await this.repository.atomicUpdate(id, updateFields);
      if (!updated) {
        throw new NotFoundError('Category not found or already deleted', 'CATEGORY_NOT_FOUND');
      }
    }

    return { categoryUpdated: true };
  }

  /**
   * Pattern A: Direct atomic soft delete.
   */
  async deleteCategory(id: string): Promise<DeleteCategoryResponseDTO> {
    const deleted = await this.repository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    }

    return { categoryDeleted: true };
  }
}

export const categoryService = new CategoryService();
export default categoryService;

// Backward-compatible named function exports
export const createCategoryService = (data: CreateCategoryDTO) => categoryService.createCategory(data);
export const getCategoriesService = (query: GetCategoriesQueryDTO) => categoryService.getCategories(query);
export const getCategoryByIdService = (idOrSlug: string) => categoryService.getCategoryByIdOrSlug(idOrSlug);
export const updateCategoryService = (id: string, data: UpdateCategoryDTO) => categoryService.updateCategory(id, data);
export const deleteCategoryService = (id: string) => categoryService.deleteCategory(id);
