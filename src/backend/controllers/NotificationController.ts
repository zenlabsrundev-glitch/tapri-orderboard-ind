import { NotificationService } from '../services/NotificationService';

type ControllerRequest = {
  params: Record<string, string | undefined>;
  body?: any;
  [key: string]: any;
};

type ControllerResponse = {
  json: (body: any) => any;
  status: (code: number) => ControllerResponse;
};

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getNotifications = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const notifications = await this.notificationService.listNotifications();
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }
  };

  markAsRead = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const id = req.params.id?.trim();
      if (!id) {
        return res.status(400).json({ error: 'Notification id is required' });
      }
      console.log(`[notifications]: Attempting to mark as read. ID: "${id}"`);
      const success = await this.notificationService.markRead(id);
      if (success) {
        console.log(`[notifications]: Success marking "${id}" as read`);
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
    }
  };

  markAllAsRead = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      await this.notificationService.markAllRead();
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to mark all notifications as read', details: error.message });
    }
  };

  deleteNotification = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const id = req.params.id?.trim();
      if (!id) {
        return res.status(400).json({ error: 'Notification id is required' });
      }
      const success = await this.notificationService.deleteNotification(id);
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete notification', details: error.message });
    }
  };

  deleteAll = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      await this.notificationService.clearAllNotifications();
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete all notifications', details: error.message });
    }
  };
}
