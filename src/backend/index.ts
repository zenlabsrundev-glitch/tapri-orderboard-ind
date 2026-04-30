import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes';
import { createNotificationRouter } from './routes/notificationRoutes';
import { createMenuRouter } from './routes/menuRoutes';
import { SupabaseMenuRepository } from './repositories/SupabaseMenuRepository';
import { SupabaseSuggestionRepository } from './repositories/SupabaseSuggestionRepository';
import { pool, migrate, ensureConnected } from './db';

const app = express();

const port = process.env.BACKEND_PORT || process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Fast database connection check (middleware)
app.use(async (req, res, next) => {
  // Skip check for health and migrate endpoints to avoid recursion/delays
  if (req.path === '/api/health' || req.path === '/api/admin/migrate') {
    return next();
  }

  const isReady = await ensureConnected();
  if (!isReady) {
    console.error('[db]: Service unavailable due to DB connection failure');
    return res.status(503).json({ 
      error: 'Database connection failed', 
      details: 'Check Vercel environment variables and Supabase status.' 
    });
  }
  next();
});

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

// --- API Routes ---

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

// Manual Migration Endpoint (Call this once after deployment)
app.get('/api/admin/migrate', async (req, res) => {
  try {
    console.log('[admin]: Manual migration triggered');
    await migrate();
    res.json({ success: true, message: 'Database migrations completed successfully.' });
  } catch (err: any) {
    console.error('[admin]: Migration failed:', err);
    res.status(500).json({ error: 'Migration failed', details: err.message });
  }
});

// --- Error Handling ---

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[server]: Unhandled Exception:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack 
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
