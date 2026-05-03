import prisma from '../../config/prisma';

interface CreateNotificationData {
  userId: string;
  title: string;
  description: string;
  type: string;
  isRead: boolean;
}

class NotificationsRepository {
  async findByUserId(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findUnreadByUserId(userId: string) {
    return await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async findById(id: string) {
    return await prisma.notification.findUnique({
      where: { id }
    });
  }

  async createMany(data: CreateNotificationData[]) {
    return await prisma.notification.createMany({
      data
    });
  }

  /**
   * Crea una única notificación y la retorna completa.
   */
  async create(data: CreateNotificationData) {
    return await prisma.notification.create({
      data
    });
  }

  /**
   * Busca si ya existe una notificación no leída de un tipo específico para un usuario.
   * Usado para deduplicación de notificaciones PENDING_REPORTS.
   */
  async findUnreadByType(userId: string, type: string) {
    return await prisma.notification.findFirst({
      where: { userId, type, isRead: false }
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
