import { useEffect, useState, useCallback } from 'react';
import type { Order, OrderStatus } from '@/lib/tapri-data';
import { useSocket } from './use-socket';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/orders`
  : '/api/orders';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { socket } = useSocket();

  // Fetch initial orders from backend
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        console.error('[useOrders] Failed to fetch orders:', res.status);
      }
    } catch (error) {
      console.error('[useOrders] Network error fetching orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    // Server creates order → everyone gets it
    socket.on('newOrder', (newOrder: Order) => {
      setOrders(prev => {
        if (prev.find(o => o.id === newOrder.id)) return prev;
        toast.success(`New order from ${newOrder.groupName}! ☕`);
        return [newOrder, ...prev];
      });
    });

    // Server updates status → sync all clients
    socket.on('orderStatusUpdated', (updatedOrder: Order) => {
      setOrders(prev =>
        prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    // Server deletes order → remove from all clients
    socket.on('orderDeleted', (id: string) => {
      setOrders(prev => prev.filter(o => o.id !== id));
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderStatusUpdated');
      socket.off('orderDeleted');
    };
  }, [socket]);

  // POST /api/orders — backend generates the final ID
  const addOrder = useCallback(async (o: Omit<Order, 'id'> & { id?: string }) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(o),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[useOrders] Failed to place order:', err);
        toast.error('Failed to place order. Try again.');
      }
      // UI update is handled by the socket 'newOrder' event
    } catch (error) {
      console.error('[useOrders] Network error placing order:', error);
      toast.error('Network error. Order not placed.');
    }
  }, []);

  // PATCH /api/orders/:id/status — optimistic update, rollback on failure
  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Status update failed');
    } catch (error) {
      console.error('[useOrders] Failed to update status:', error);
      toast.error('Failed to update order status.');
      fetchOrders(); // rollback
    }
  }, [fetchOrders]);

  // DELETE /api/orders/:id — optimistic update, rollback on failure
  const removeOrder = useCallback(async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (error) {
      console.error('[useOrders] Failed to remove order:', error);
      toast.error('Failed to delete order.');
      fetchOrders(); // rollback
    }
  }, [fetchOrders]);

  return { orders, addOrder, updateStatus, removeOrder };
};
