import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoriesService.getAllCategories();
    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = await categoriesService.getCategoryById(id);
    res.status(200).json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = await categoriesService.updateCategory(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await categoriesService.deactivateCategory(id);
    res.status(200).json({
      success: true,
      message: 'Categoría desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
