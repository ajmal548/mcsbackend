// Re-export from colocated category schema for backward compatibility
export {
  createCategoryRequestSchema as createCategorySchema,
  updateCategoryRequestSchema as updateCategorySchema,
  getCategoriesRequestSchema as getCategoriesSchema,
  CategoryFieldDtoSchema as categoryFieldSchema,
} from '../modules/category/category.schema';
