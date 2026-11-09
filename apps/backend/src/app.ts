import express from 'express';
import cors from 'cors';
import { readConfig } from './config.ts';

export function createApp(origins = readConfig().origins) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'backend' });
  });

  app.get('/api/hello', (_request, response) => {
    response.json({ message: 'Hello from Express!' });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });
  return app;
}

export const app = createApp();
