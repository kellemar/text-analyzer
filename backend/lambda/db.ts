import { Pool } from 'pg';
import { readFileSync } from 'fs';

let pool: Pool | null = null;

export const getPool = () => {
  if (pool) return pool;

  pool = new Pool({
    ssl: {
      ca: readFileSync(process.env.RDS_CA_PATH ?? '/opt/rds-combined-ca-bundle.pem').toString(),
      rejectUnauthorized: true,
    },
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
    max: 2,
  });

  return pool;
};

export const closePool = async () => {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
  }
};

process.on('beforeExit', async () => {
  await closePool();
});
