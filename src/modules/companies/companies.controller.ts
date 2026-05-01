import { Request, Response, NextFunction } from 'express';
import { companiesService } from './companies.service';

export const getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await companiesService.getAllCompanies();
    res.status(200).json({
      success: true,
      data: {
        companies
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const company = await companiesService.getCompanyById(id);
    res.status(200).json({
      success: true,
      data: {
        company
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCompaniesByCategoryName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryName } = req.params;
    const companies = await companiesService.getCompaniesByCategoryName(categoryName);
    res.status(200).json({
      success: true,
      data: {
        companies
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companiesService.createCompany(req.body);
    res.status(201).json({
      success: true,
      message: 'Compañía creada exitosamente',
      data: {
        company
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const company = await companiesService.updateCompany(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Compañía actualizada exitosamente',
      data: {
        company
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await companiesService.deactivateCompany(id);
    res.status(200).json({
      success: true,
      message: 'Compañía desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
