import { Notification, NotificationType } from '../entities/Notification';
import { INotificationRepository } from '../repositories/NotificationRepository';

export class NotificationService {
  constructor(
    private notificationRepo: INotificationRepository
  ) {}

  async createNotification(type: NotificationType, title: string, message: string, orderId?: string): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      message,
      orderId,
      isRead: false,
      createdAt: Date.now(),
    };

    const saved = await this.notificationRepo.create(notification);
    
    return saved;
  }

  async listNotifications(): Promise<Notification[]> {
    return this.notificationRepo.getAll();
  }

  async markRead(id: string): Promise<boolean> {
    return this.notificationRepo.markAsRead(id);
  }

  async markAllRead(): Promise<void> {
    return this.notificationRepo.markAllAsRead();
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notificationRepo.delete(id);
  }

  async clearAllNotifications(): Promise<void> {
    return this.notificationRepo.deleteAll();
  }
}
