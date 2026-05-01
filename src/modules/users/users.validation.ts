import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim(),
  lastname: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  companyId: z.string().uuid('ID de compañía inválido')
});


const createCompanyUserSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim(),
  lastname: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  companyId: z.string().uuid('ID de compañía inválido')
});

export const validateCreateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await createEmployeeSchema.parseAsync(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de empleado inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateCreateCompanyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await createCompanyUserSchema.parseAsync(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de usuario de empresa inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};
