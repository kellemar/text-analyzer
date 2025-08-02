import { Hono } from 'hono';
import { getPool } from '../db';

export const registerMigrationRoute = (app: Hono) => {
  app.get('/add-original-text-column', async c => {
    const db = getPool();
    try {
      // Check if the column already exists
      const columnCheckResult = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'article_logs' 
          AND table_schema = 'public' 
          AND column_name = 'original_text';
      `);

      if (columnCheckResult.rows.length > 0) {
        return c.json({ 
          message: 'Column already exists',
          success: true,
          columnExists: true
        });
      }

      // Add the original_text column to article_logs table
      await db.query(`
        ALTER TABLE article_logs 
        ADD COLUMN original_text TEXT;
      `);

      // Verify the column was added successfully
      const verifyResult = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'article_logs' 
          AND table_schema = 'public' 
          AND column_name = 'original_text';
      `);

      if (verifyResult.rows.length === 0) {
        throw new Error('Column was not created successfully');
      }

      return c.json({
        message: 'Successfully added original_text column to article_logs table',
        success: true,
        columnDetails: verifyResult.rows[0]
      });

    } catch (err) {
      console.error('Migration error:', err);
      return c.json({ 
        error: 'Failed to add original_text column', 
        details: String(err),
        success: false
      }, 500);
    }
  });


  app.get('/add-uploaded-file-column', async c => {
    const db = getPool();
    try {
      // Check if the column already exists
      const columnCheckResult = await db.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'article_logs' 
          AND table_schema = 'public' 
          AND column_name = 'uploaded_file';
      `);

      if (columnCheckResult.rows.length > 0) {
        return c.json({ 
          message: 'Column already exists',
          success: true,
          columnExists: true
        });
      }

      // Add the original_text column to article_logs table
      await db.query(`
        ALTER TABLE article_logs 
        ADD COLUMN uploaded_file TEXT;
      `);

      // Verify the column was added successfully
      const verifyResult = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'article_logs' 
          AND table_schema = 'public' 
          AND column_name = 'uploaded_file';
      `);

      if (verifyResult.rows.length === 0) {
        throw new Error('Column was not created successfully');
      }

      return c.json({
        message: 'Successfully added uploaded_file column to article_logs table',
        success: true,
        columnDetails: verifyResult.rows[0]
      });

    } catch (err) {
      console.error('Migration error:', err);
      return c.json({ 
        error: 'Failed to add uploaded_file column', 
        details: String(err),
        success: false
      }, 500);
    }
  });
};
