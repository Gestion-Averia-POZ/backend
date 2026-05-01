import { Router } from 'express';
import {
  getNotificationsByUser,
  markAsRead,
  markAllAsRead
} from './notifications.controller';
import { validateUserId, validateNotificationId } from './notifications.validation';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestión de notificaciones de usuario
 */

/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     summary: Obtener notificaciones de un usuario
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/user/:userId', authenticateToken, validateUserId, getNotificationsByUser);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notificación actualizada
 */
router.patch('/:id/read', authenticateToken, validateNotificationId, markAsRead);

/**
 * @swagger
 * /api/notifications/user/{userId}/read-all:
 *   patch:
 *     summary: Marcar todas las notificaciones de un usuario como leídas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notificaciones actualizadas
 */
router.patch('/user/:userId/read-all', authenticateToken, validateUserId, markAllAsRead);

export default router;
