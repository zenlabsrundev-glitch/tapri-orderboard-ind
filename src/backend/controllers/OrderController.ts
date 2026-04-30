import { OrderService } from '../services/OrderService';

type ControllerRequest = {
  params: Record<string, string | undefined>;
  body?: any;
  notificationService?: {
    createNotification: (type: string, title: string, message: string, orderId?: string) => Promise<any>;
  };
  [key: string]: any;
};

type ControllerResponse = {
  json: (body: any) => any;
  status: (code: number) => ControllerResponse;
  send: (body?: any) => any;
};

export class OrderController {
  constructor(private orderService: OrderService) {}

  getAllOrders = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const orders = await this.orderService.listOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
  };

  createOrder = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const order = await this.orderService.placeOrder(req.body);
      
      // 1. Create persistent notification
      await (req as any).notificationService.createNotification(
        'new_order',
        'New Order Received! ☕',
        `A new order for ${order.groupName} has been placed.`,
        order.id
      );

      res.status(201).json(order);
    } catch (error: any) {
      console.error('[OrderController] createOrder error:', error);
      res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
  };

  updateStatus = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await this.orderService.updateOrderStatus(id as string, status);
      if (order) {
        // 1. Create persistent notification
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
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update order status', details: error.message });
    }
  };

  deleteOrder = async (req: ControllerRequest, res: ControllerResponse) => {
    try {
      const { id } = req.params;
      const success = await this.orderService.cancelOrder(id as string);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Order not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete order', details: error.message });
    }
  };
}
