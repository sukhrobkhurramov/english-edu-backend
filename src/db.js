import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;
export const db = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000
});

db.on('error', error => console.error('Unexpected PostgreSQL error', error));

export async function query(text, params = []) {
  return db.query(text, params);
}

export async function transaction(callback) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
