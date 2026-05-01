import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.user?.userId;
    if (!creatorId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const employee = await usersService.createEmployee(req.body, creatorId);
    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: { employee }
    });
  } catch (error: any) {
    next(error);
  }
};

export const createCompanyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyUser = await usersService.createCompanyUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Usuario de empresa creado exitosamente',
      data: { companyUser }
    });
  } catch (error: any) {
    next(error);
  }
};
