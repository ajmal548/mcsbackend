import { Request, Response } from 'express';
import * as categoryService from './category.service';

export const createCategory = async (req: Request, res: Response) => {
  const result = await categoryService.createCategoryService(req.body);
  return res.status(201).json(result);
};

export const getCategories = async (req: Request, res: Response) => {
  const result = await categoryService.getCategoriesService(req.query as any);
  return res.json(result);
};

export const getCategoryById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.getCategoryByIdService(id);
  return res.json(result);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.updateCategoryService(id, req.body);
  return res.json(result);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await categoryService.deleteCategoryService(id);
  return res.json(result);
};
