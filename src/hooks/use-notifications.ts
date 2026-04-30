import { useEffect, useState, useCallback, useMemo } from 'react';

export type NotificationType = 'new_order' | 'status_update' | 'delayed' | 'pickup_reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: number;
}

const API_BASE = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/notifications` : '/api/notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      if (!isSilent) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling for updates (replaces Socket.io)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 5000); // 5 seconds polling

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/read-all`, { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    try {
      const res = await fetch(API_BASE, { method: 'DELETE' });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications };
};
