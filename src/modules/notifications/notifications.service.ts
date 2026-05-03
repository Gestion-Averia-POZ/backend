import { notificationsRepository } from './notifications.repository';
import * as socketService from '../../services/socket.service';
import prisma from '../../config/prisma';

interface CreateNotificationData {
  userId: string;
  title: string;
  description: string;
  type: string;
}

class NotificationsService {
  async getNotificationsByUserId(userId: string) {
    return await notificationsRepository.findByUserId(userId);
  }

  async markAsRead(id: string) {
    const notification = await notificationsRepository.findById(id);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }
    return await notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return await notificationsRepository.markAllAsRead(userId);
  }

  async getUnreadByUserId(userId: string) {
    return await notificationsRepository.findUnreadByUserId(userId);
  }

  /**
   * Crea una única notificación, la persiste en BD y la emite en tiempo real
   * al usuario si está conectado via WebSocket.
   */
  async create(data: CreateNotificationData) {
    const notification = await notificationsRepository.create({
      ...data,
      isRead: false
    });

    // Emitir en tiempo real (no bloqueante: si el usuario no está conectado, la
    // notificación ya quedó en BD y la verá al hacer fetch en su próxima sesión)
    socketService.notifyUser(data.userId, notification);

    return notification;
  }

  /**
   * Notifica a todos los administradores activos del sistema.
   * Usa createMany (sin emit de socket individual) — los admins ven
   * sus notificaciones al hacer fetch.
   */
  async notifyAllAdmins(title: string, description: string, type: string) {
    const admins = await prisma.user.findMany({
      where: {
        role: { name: 'ADMIN' },
        isActive: true
      },
      select: { id: true }
    });

    if (admins.length === 0) return;

    const notificationsData = admins.map(admin => ({
      userId: admin.id,
      title,
      description,
      type,
      isRead: false
    }));

    return await notificationsRepository.createMany(notificationsData);
  }

  /**
   * Notifica a todos los usuarios con rol COMPANY de una empresa específica.
   * Crea una notificación individual por usuario (para poder emitir el socket por cada uno).
   * Incluye deduplicación: si ya existe una notificación no leída del mismo tipo
   * para ese usuario, no se crea otra.
   */
  async notifyCompanyManagers(
    companyId: string,
    title: string,
    description: string,
    type: string
  ) {
    const managers = await prisma.user.findMany({
      where: {
        role: { name: 'COMPANY' },
        companyId,
        isActive: true
      },
      select: { id: true }
    });

    if (managers.length === 0) return;

    for (const manager of managers) {
      // Deduplicación: no enviar si ya tiene una notificación no leída de este tipo
      const existing = await notificationsRepository.findUnreadByType(manager.id, type);
      if (existing) continue;

      await this.create({ userId: manager.id, title, description, type });
    }
  }
}

export const notificationsService = new NotificationsService();
