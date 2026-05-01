import { notificationsRepository } from './notifications.repository';

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
}

export const notificationsService = new NotificationsService();
