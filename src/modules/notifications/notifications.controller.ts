import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';

export const getNotificationsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationsService.getNotificationsByUserId(userId);
    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await notificationsService.markAsRead(id);
    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    await notificationsService.markAllAsRead(userId);
    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationsService.getUnreadByUserId(userId);
    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

