import Category, { ICategory } from '../../schemas/category.schema';
import AppError from '../../utils/appError';

// Helper slug generator
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const createCategoryService = async (categoryData: Partial<ICategory>) => {
  if (!categoryData.name) {
    throw new AppError('Category name is required', 400);
  }

  const slug = categoryData.slug ? slugify(categoryData.slug) : slugify(categoryData.name);

  const existingCategory = await Category.findOne({
    $or: [{ name: categoryData.name }, { slug }],
  });

  if (existingCategory) {
    throw new AppError('Category with this name or slug already exists', 400);
  }

  const category = new Category({
    ...categoryData,
    slug,
  });

  return await category.save();
};

export const getCategoriesService = async (queryParams: {
  search?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}) => {
  const page = parseInt(queryParams.page || '1');
  const limit = parseInt(queryParams.limit || '20');
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } },
      { types: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === 'true';
  }

  const categories = await Category.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Category.countDocuments(filter);

  return {
    data: categories,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getCategoryByIdService = async (idOrSlug: string) => {
  let category;
  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    category = await Category.findById(idOrSlug);
  } else {
    category = await Category.findOne({ slug: idOrSlug });
  }

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

export const updateCategoryService = async (id: string, updateData: Partial<ICategory>) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (updateData.name && updateData.name !== category.name) {
    const newSlug = updateData.slug ? slugify(updateData.slug) : slugify(updateData.name);
    const existing = await Category.findOne({ _id: { $ne: id }, $or: [{ name: updateData.name }, { slug: newSlug }] });
    if (existing) {
      throw new AppError('Category with this name or slug already exists', 400);
    }
    updateData.slug = newSlug;
  }

  Object.assign(category, updateData);
  return await category.save();
};

export const deleteCategoryService = async (id: string) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return { message: 'Category deleted successfully' };
};
