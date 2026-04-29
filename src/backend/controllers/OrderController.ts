import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';

export class OrderController {
  constructor(private orderService: OrderService) {}

  getAllOrders = async (req: any, res: any) => {
    try {
      const orders = await this.orderService.listOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  };

  createOrder = async (req: any, res: any) => {
    try {
      const order = await this.orderService.placeOrder(req.body);
      
      // 1. Live socket broadcast
      (req as any).io.emit('newOrder', order);
      
      // 2. Create persistent notification
      await (req as any).notificationService.createNotification(
        'new_order',
        'New Order Received! ☕',
        `A new order for ${order.groupName} has been placed.`,
        order.id
      );

      res.status(201).json(order);
    } catch (error) {
      console.error('[OrderController] createOrder error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  };

  updateStatus = async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await this.orderService.updateOrderStatus(id as string, status);
      if (order) {
        // 1. Live socket broadcast
        (req as any).io.emit('orderStatusUpdated', order);

        // 2. Create persistent notification
        await (req as any).notificationService.createNotification(
          'status_update',
          'Order Status Updated',
          `Order for ${order.groupName} is now ${status.toUpperCase()}.`,
          order.id
        );

        res.json(order);
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  };

  deleteOrder = async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const success = await this.orderService.cancelOrder(id as string);
      if (success) {
        (req as any).io.emit('orderDeleted', id); // Notify about deletion
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  };
}
