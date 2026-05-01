import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

export const createCompanySchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'El nombre es requerido',
        invalid_type_error: 'El nombre debe ser una cadena de texto'
      })
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(150, 'El nombre no puede exceder 150 caracteres')
      .trim(),
    description: z
      .string()
      .optional(),
    rif: z
      .string()
      .max(50, 'El RIF no puede exceder 50 caracteres')
      .optional(),
    address: z
      .string()
      .optional()
  })
});

export const updateCompanySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(150, 'El nombre no puede exceder 150 caracteres')
      .trim()
      .optional(),
    description: z
      .string()
      .optional(),
    rif: z
      .string()
      .max(50, 'El RIF no puede exceder 50 caracteres')
      .optional(),
    address: z
      .string()
      .optional()
  })
});

export const validateCreateCompany = validate(createCompanySchema);
export const validateUpdateCompany = validate(updateCompanySchema);

export type CreateCompanyData = z.infer<typeof createCompanySchema>['body'];
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>['body'];
