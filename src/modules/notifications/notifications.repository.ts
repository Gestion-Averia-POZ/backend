import prisma from '../../config/prisma';

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

  async createMany(data: any[]) {
    return await prisma.notification.createMany({
      data
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
