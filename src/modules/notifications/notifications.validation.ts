import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

export const userIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid('ID de usuario inválido')
  })
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de notificación inválido')
  })
});

export const validateUserId = validate(userIdSchema);
export const validateNotificationId = validate(notificationIdSchema);
