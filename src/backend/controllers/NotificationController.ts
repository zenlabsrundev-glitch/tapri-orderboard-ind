import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getNotifications = async (req: any, res: any) => {
    try {
      const notifications = await this.notificationService.listNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };

  markAsRead = async (req: any, res: any) => {
    try {
      const id = req.params.id?.trim();
      console.log(`[notifications]: Attempting to mark as read. ID: "${id}"`);
      const success = await this.notificationService.markRead(id);
      if (success) {
        console.log(`[notifications]: Success marking "${id}" as read`);
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  };

  markAllAsRead = async (req: any, res: any) => {
    try {
      await this.notificationService.markAllRead();
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  };

  deleteNotification = async (req: any, res: any) => {
    try {
      const id = req.params.id?.trim();
      const success = await this.notificationService.deleteNotification(id);
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  };

  deleteAll = async (req: any, res: any) => {
    try {
      await this.notificationService.clearAllNotifications();
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete all notifications' });
    }
  };
}
