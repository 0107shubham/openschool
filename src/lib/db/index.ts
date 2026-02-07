import { Pool } from 'pg';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // In development, use a global variable so the pool 
  // isn't re-created on every hot reload
  if (!(global as any).postgresPool) {
    (global as any).postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  pool = (global as any).postgresPool;
}

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};
