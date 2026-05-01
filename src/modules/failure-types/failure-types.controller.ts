import { Request, Response, NextFunction } from 'express';
import { failureTypesService } from './failure-types.service';

export const getAllFailureTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const failureTypes = await failureTypesService.getAllFailureTypes();
    res.status(200).json({
      success: true,
      data: { failureTypes }
    });
  } catch (error) {
    next(error);
  }
};

export const getFailureTypeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const failureType = await failureTypesService.getFailureTypeById(id);
    res.status(200).json({
      success: true,
      data: { failureType }
    });
  } catch (error) {
    next(error);
  }
};

export const getFailureTypesByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const failureTypes = await failureTypesService.getFailureTypesByCategory(categoryId);
    res.status(200).json({
      success: true,
      data: { failureTypes }
    });
  } catch (error) {
    next(error);
  }
};

export const createFailureType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const failureType = await failureTypesService.createFailureType(req.body);
    res.status(201).json({
      success: true,
      message: 'Tipo de falla creado exitosamente',
      data: { failureType }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateFailureType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const failureType = await failureTypesService.updateFailureType(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Tipo de falla actualizado exitosamente',
      data: { failureType }
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deactivateFailureType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    await failureTypesService.deactivateFailureType(id);
    res.status(200).json({
      success: true,
      message: 'Tipo de falla desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
