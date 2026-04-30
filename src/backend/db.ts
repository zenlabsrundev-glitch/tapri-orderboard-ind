import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log(`[db]: Initializing connection to ${process.env.SUPABASE_HOST} as user ${process.env.SUPABASE_USER}`);

export const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  port: parseInt(process.env.SUPABASE_PORT || '5432'),
  database: process.env.SUPABASE_DB,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

let migrationsRun = false;


export const migrate = async () => {
  if (migrationsRun) return;

  const client = await pool.connect();
  try {
    console.log('[db]: Starting auto-migrations...');

    // Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        group_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        items JSONB NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        pickup_time TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        urgent BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    // Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at BIGINT NOT NULL
      );
    `);

    // Menu Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        emoji TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category TEXT NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);

    await client.query(`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
    `);

    await client.query(`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    // Suggestions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suggestions (
        group_name TEXT PRIMARY KEY,
        items_text TEXT NOT NULL,
        preset_items JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);

    migrationsRun = true;
    console.log('[db]: Auto-migrations completed successfully.');

  } catch (err) {
    console.error('[db]: Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const ensureConnected = async () => {
  try {
    await migrate();
    // Simple query to test connection
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[db]: Connection test failed:', err);
    return false;
  }
};

