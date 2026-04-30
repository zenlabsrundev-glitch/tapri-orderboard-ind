import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes';
import { createNotificationRouter } from './routes/notificationRoutes';
import { createMenuRouter } from './routes/menuRoutes';
import { SupabaseMenuRepository } from './repositories/SupabaseMenuRepository';
import { SupabaseSuggestionRepository } from './repositories/SupabaseSuggestionRepository';
import { pool, migrate } from './db';

const app = express();

const port = process.env.BACKEND_PORT || process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Normalize URLs
app.use((req, res, next) => {
  req.url = req.url.replace(/\/+/g, '/');
  next();
});

// Initialize Notification System
const { router: notificationRouter, notificationService } = createNotificationRouter();

// Attach services to request
app.use((req, res, next) => {
  (req as any).notificationService = notificationService;
  next();
});

// Initialize Menu System
const menuRepo = new SupabaseMenuRepository(pool);
const suggestionRepo = new SupabaseSuggestionRepository(pool);
const menuRouter = createMenuRouter(menuRepo, suggestionRepo);

// API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRouter);
app.use('/api/menu', menuRouter);

// Basic Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node: process.version
  });
});

const startServer = async () => {
  try {
    await migrate();
    app.listen(port, () => {
      console.log(`[server]: Tapri Backend is running on port ${port} ☕`);
    });
  } catch (err) {
    console.error('[server]: Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export { app };
export default app;
