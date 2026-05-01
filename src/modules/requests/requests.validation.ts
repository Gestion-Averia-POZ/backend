import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createRequestSchema = z.object({
  applicantName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede tener más de 150 caracteres')
    .trim(),
  type: z.enum(['REGISTRO', 'DUDA', 'BUG'], {
    errorMap: () => ({ message: 'Tipo de solicitud inválido (REGISTRO, DUDA, BUG)' })
  }),
  description: z.string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .trim()
});

const updateRequestStateSchema = z.object({
  state: z.enum(['PENDIENTE', 'APROBADO', 'CANCELADO'], {
    errorMap: () => ({ message: 'Estado inválido (PENDIENTE, APROBADO, CANCELADO)' })
  })
});

export const validateCreateRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await createRequestSchema.parseAsync(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de solicitud inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

export const validateUpdateRequestState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await updateRequestStateSchema.parseAsync(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Estado de solicitud inválido',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};
