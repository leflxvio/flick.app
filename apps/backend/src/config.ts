export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const nodeEnv = env['NODE_ENV'] ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }

  const port = Number(env['PORT'] ?? 4100);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const origins = (env['CORS_ORIGINS'] ?? (nodeEnv === 'production'
    ? 'https://flick.f-l.dev'
    : 'http://localhost:4000,http://127.0.0.1:4000'))
    .split(',').map((origin) => origin.trim());
  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error('CORS_ORIGINS must contain comma-separated HTTP origins without paths');
    }
  }

  return { nodeEnv, port, origins };
}
