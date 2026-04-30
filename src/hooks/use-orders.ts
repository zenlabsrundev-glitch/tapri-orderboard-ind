import { useEffect, useState, useCallback } from 'react';
import { getApiBase } from '@/lib/api-utils';
import type { Order, OrderStatus } from '@/lib/tapri-data';
import { toast } from 'sonner';

const API_BASE = getApiBase('orders');

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Fetch initial orders from backend
  const fetchOrders = useCallback(async (isSilent = false) => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (!isSilent) {
        console.error('[useOrders] Failed to fetch orders:', res.status);
      }
    } catch (error) {
      if (!isSilent) {
        console.error('[useOrders] Network error fetching orders:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Polling for updates (replaces Socket.io)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true); // silent fetch to avoid console noise during polling
    }, 5000); // 5 seconds polling

    return () => clearInterval(interval);
  }, [fetchOrders]);

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
      // UI update is handled by polling in this version
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
