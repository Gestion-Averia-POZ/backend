import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Schema para registro con validaciones robustas
const registerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(15, 'El nombre no puede tener más de 15 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim(),
  lastname: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(15, 'El apellido no puede tener más de 15 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .max(40, 'El email no puede tener más de 30 caracteres')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(25, 'La contraseña no puede tener más de 25 caracteres'),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal(''))
});

// Schema para login
const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'La contraseña es requerida')
});

// Schema para actualizar usuario (todos los campos opcionales)
const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .trim()
    .optional(),
  lastname: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios')
    .trim()
    .optional(),
  email: z.string()
    .email('Email inválido')
    .max(150, 'El email no puede tener más de 150 caracteres')
    .toLowerCase()
    .trim()
    .optional(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número')
    .optional(),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
  verifiedEmail: z.boolean().optional()
});

// Tipos TypeScript derivados de los schemas
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;

export const validateRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await registerSchema.parseAsync(req.body);
    req.body = validatedData; // Reemplazar con datos validados y transformados
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de registro inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await loginSchema.parseAsync(req.body);
    req.body = validatedData; // Reemplazar con datos validados y transformados
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de login inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateUpdateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await updateUserSchema.parseAsync(req.body);
    req.body = validatedData; // Reemplazar con datos validados y transformados
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de actualización inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};