import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
        invalid_type_error: 'El nombre debe ser una cadena de texto'
      })
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim()
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string({
        invalid_type_error: 'El nombre debe ser una cadena de texto'
      })
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim()
      .optional()
  })
});

export const validateCreateCategory = validate(createCategorySchema);
export const validateUpdateCategory = validate(updateCategorySchema);

export type CreateCategoryData = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>['body'];
