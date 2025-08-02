import { Hono } from 'hono';
import { getPool } from '../db';

export const registerDescribeTablesRoute = (app: Hono) => {
  app.get('/describe-tables', async c => {
    const db = getPool();
    try {
      // Query to get all tables in the 'postgres' schema
      const tablesResult = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      const tables = tablesResult.rows.map(row => row.table_name);
      const descriptions: Record<string, any> = {};
      for (const table of tables) {
        const columnsResult = await db.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_name = $1 AND table_schema = 'public'
           ORDER BY ordinal_position;`,
          [table]
        );
        descriptions[table] = columnsResult.rows;
      }
      return c.json({ tables: descriptions });
    } catch (err) {
      return c.json({ error: 'Failed to describe tables', details: String(err) }, 500);
    }
  });
};
