import { notificationsRepository } from './notifications.repository';
import prisma from '../../config/prisma';

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

  async notifyAllAdmins(title: string, description: string, type: string) {
    // Buscar todos los administradores
    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: 'ADMIN'
        },
        isActive: true
      },
      select: { id: true }
    });

    if (admins.length === 0) return;

    // Crear notificaciones para cada admin
    const notificationsData = admins.map(admin => ({
      userId: admin.id,
      title,
      description,
      type,
      isRead: false
    }));

    return await notificationsRepository.createMany(notificationsData);
  }
}

export const notificationsService = new NotificationsService();
