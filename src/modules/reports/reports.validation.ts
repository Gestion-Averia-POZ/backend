import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

// Validación para crear reporte
export const createReportSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'El título es requerido',
        invalid_type_error: 'El título debe ser una cadena de texto'
      })
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres')
      .trim(),
    description: z
      .string({
        required_error: 'La descripción es requerida',
        invalid_type_error: 'La descripción debe ser una cadena de texto'
      })
      .min(10, 'La descripción debe tener al menos 10 caracteres')
      .max(500, 'La descripción no puede exceder 500 caracteres')
      .trim(),
    latitude: z
      .number({
        required_error: 'La latitud es requerida',
        invalid_type_error: 'La latitud debe ser un número'
      })
      .min(-90, 'La latitud debe estar entre -90 y 90')
      .max(90, 'La latitud debe estar entre -90 y 90'),
    longitude: z
      .number({
        required_error: 'La longitud es requerida',
        invalid_type_error: 'La longitud debe ser un número'
      })
      .min(-180, 'La longitud debe estar entre -180 y 180')
      .max(180, 'La longitud debe estar entre -180 y 180'),
    categoryId: z
      .string({
        required_error: 'La categoría es requerida',
        invalid_type_error: 'La categoría debe ser una cadena de texto'
      })
      .uuid('ID de categoría inválido'),
    priority: z
      .enum(['BAJA', 'MEDIA', 'ALTA'], {
        invalid_type_error: 'La prioridad debe ser BAJA, MEDIA o ALTA'
      })
      .optional()
      .default('MEDIA'),
    images: z
      .array(z.string().url('URL de imagen inválida'))
      .optional()
  })
});

// Validación para detectar barrio
export const detectNeighborhoodSchema = z.object({
  body: z.object({
    latitude: z
      .number({
        required_error: 'La latitud es requerida',
        invalid_type_error: 'La latitud debe ser un número'
      })
      .min(-90, 'La latitud debe estar entre -90 y 90')
      .max(90, 'La latitud debe estar entre -90 y 90'),
    longitude: z
      .number({
        required_error: 'La longitud es requerida',
        invalid_type_error: 'La longitud debe ser un número'
      })
      .min(-180, 'La longitud debe estar entre -180 y 180')
      .max(180, 'La longitud debe estar entre -180 y 180')
  })
});

// Validación para filtros de reportes
export const reportsFiltersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    neighborhoodName: z
      .string()
      .optional(),
    serviceName: z
      .string()
      .optional(),
    assignedManagerId: z
      .string()
      .uuid('ID de persona asignada inválido')
      .optional(),
    categoryName: z
      .string()
      .optional(),
    stateName: z
      .string()
      .optional(),
    companyName: z
      .string()
      .optional(),
    priority: z
      .enum(['BAJA', 'MEDIA', 'ALTA'], {
        invalid_type_error: 'La prioridad debe ser BAJA, MEDIA o ALTA'
      })
      .optional(),
    reportState: z
      .enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'], {
        invalid_type_error: 'El estado del reporte debe ser PENDIENTE, EN_PROCESO, COMPLETADO o CANCELADO'
      })
      .optional()
  })
});

// Middleware de validación
export const validateCreateReport = validate(createReportSchema);
export const validateDetectNeighborhood = validate(detectNeighborhoodSchema);
export const validateReportsFilters = validate(reportsFiltersSchema);

// Tipos TypeScript
export type CreateReportData = z.infer<typeof createReportSchema>['body'];
export type DetectNeighborhoodData = z.infer<typeof detectNeighborhoodSchema>['body'];
export type ReportsFiltersData = z.infer<typeof reportsFiltersSchema>['query'];
