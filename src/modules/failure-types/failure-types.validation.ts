import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

export const createFailureTypeSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es requerido' })
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder los 100 caracteres'),
    description: z
      .string()
      .max(500, 'La descripción no puede exceder los 500 caracteres')
      .optional(),
    priority: z
      .enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
        errorMap: () => ({ message: 'Prioridad inválida. Debe ser BAJA, MEDIA, ALTA o CRITICA' })
      })
      .default('MEDIA'),
    categoryId: z
      .string()
      .uuid('ID de categoría inválido')
      .optional()
  })
});

export const updateFailureTypeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder los 100 caracteres')
      .optional(),
    description: z
      .string()
      .max(500, 'La descripción no puede exceder los 500 caracteres')
      .optional(),
    priority: z
      .enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'])
      .optional(),
    categoryId: z
      .string()
      .uuid('ID de categoría inválido')
      .optional(),
    isActive: z
      .boolean()
      .optional()
  })
});

export const validateCreateFailureType = validate(createFailureTypeSchema);
export const validateUpdateFailureType = validate(updateFailureTypeSchema);

export type CreateFailureTypeData = z.infer<typeof createFailureTypeSchema>['body'];
export type UpdateFailureTypeData = z.infer<typeof updateFailureTypeSchema>['body'];
