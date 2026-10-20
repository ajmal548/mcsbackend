import { Request, Response } from 'express';
import { categoryService } from './category.service';
import { sendSuccess } from '../../utils/responseHandlers';
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  GetCategoriesQueryDTO,
} from './category.schema';

/**
 * Controller: Handles incoming HTTP requests for the Category domain.
 * Enforces single service invocation and uniform response envelope dispatch.
 */
export const createCategory = async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body as CreateCategoryDTO);
  return sendSuccess(res, result, 'Category created successfully', 201);
};

export const getCategories = async (req: Request, res: Response) => {
  const { items, meta } = await categoryService.getCategories(req.query as unknown as GetCategoriesQueryDTO);
  return sendSuccess(res, items, 'Categories retrieved successfully', 200, meta);
};

export const getCategoryById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.getCategoryByIdOrSlug(id);
  return sendSuccess(res, result, 'Category details retrieved successfully', 200);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.updateCategory(id, req.body as UpdateCategoryDTO);
  return sendSuccess(res, result, 'Category updated successfully', 200);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.deleteCategory(id);
  return sendSuccess(res, result, 'Category deleted successfully', 200);
};
