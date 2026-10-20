import { ICategoryLean } from './category.model';
import { CategoryResponseDTO } from './category.schema';

/**
 * Maps a lean category database document to a clean client response DTO.
 * Strips internal database attributes (__v, isDeleted, deletedAt).
 */
export const toCategoryResponseDTO = (category: ICategoryLean): CategoryResponseDTO => ({
  id: category._id.toString(),
  name: category.name,
  slug: category.slug,
  description: category.description || '',
  icon: category.icon || null,
  types: Array.isArray(category.types) ? category.types : [],
  fields: Array.isArray(category.fields)
    ? category.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: Boolean(f.required),
        options: Array.isArray(f.options) ? f.options : [],
      }))
    : [],
  isActive: category.isActive,
  createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : new Date(category.createdAt).toISOString(),
  updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : new Date(category.updatedAt).toISOString(),
});

export const toCategoryResponseDTOList = (categories: ICategoryLean[]): CategoryResponseDTO[] =>
  categories.map(toCategoryResponseDTO);
