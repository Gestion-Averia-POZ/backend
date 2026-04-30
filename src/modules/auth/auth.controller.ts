import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, lastname, email, password, phoneNumber } = req.body;
    
    const result = await authService.register({
      name,
      lastname,
      email,
      password,
      phoneNumber
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const checkEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;
    
    const exists = await authService.checkEmailExists(email);

    res.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const user = await authService.getUserById(id);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;
    
    const user = await authService.getUserByEmail(email);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', role, companyName } = req.query;
    
    const users = await authService.getAllUsers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      role: role as string,
      companyName: companyName as string
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const user = await authService.updateUser(id, updateData);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await authService.deleteUser(id);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};