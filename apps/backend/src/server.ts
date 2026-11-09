import { app } from './app.ts';
import { readConfig } from './config.ts';

const { port, nodeEnv } = readConfig();

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on port ${port} (${nodeEnv})`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
