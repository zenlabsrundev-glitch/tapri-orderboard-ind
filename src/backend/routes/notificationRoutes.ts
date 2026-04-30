import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationService } from '../services/NotificationService';
import { SupabaseNotificationRepository } from '../repositories/SupabaseNotificationRepository';

// Factory function to initialize routes and return the router + service
export const createNotificationRouter = () => {
  const router = Router();
  const notificationRepo = new SupabaseNotificationRepository();
  const notificationService = new NotificationService(notificationRepo);
  const notificationController = new NotificationController(notificationService);

  // We expose the service so OrderController can use it
  router.get('/', notificationController.getNotifications);
  router.patch('/:id/read', notificationController.markAsRead);
  router.post('/read-all', notificationController.markAllAsRead);
  router.delete('/:id', notificationController.deleteNotification);
  router.delete('/', notificationController.deleteAll);

  return { router, notificationService };
};
