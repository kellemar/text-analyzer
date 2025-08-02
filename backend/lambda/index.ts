import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { registerAuthRoutes } from './routes/login';
import { registerAnalyzeRoute } from './routes/analyze';
import { registerDescribeTablesRoute } from './routes/describe-tables';
import { registerMigrationRoute } from './routes/migration';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGINS ?? '*',
    allowMethods: ['POST', 'OPTIONS', 'GET', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

registerAuthRoutes(app);
registerAnalyzeRoute(app);
registerDescribeTablesRoute(app);
registerMigrationRoute(app);

app.get('/', c => c.text('OK'));

export const handler = handle(app);
