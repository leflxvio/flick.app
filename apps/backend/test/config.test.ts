import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readConfig } from '../src/config.ts';

test('development uses local ports and frontend origins', () => {
  assert.deepEqual(readConfig({}), {
    nodeEnv: 'development', port: 4100,
    origins: ['http://localhost:4000', 'http://127.0.0.1:4000'],
  });
});

test('production allows only the deployed frontend by default', () => {
  assert.deepEqual(readConfig({ NODE_ENV: 'production' }).origins, ['https://flick.f-l.dev']);
});

test('deployment can override ports and origins', () => {
  const config = readConfig({ NODE_ENV: 'production', PORT: '3100', CORS_ORIGINS: 'https://example.com, https://other.example.com' });
  assert.equal(config.port, 3100);
  assert.deepEqual(config.origins, ['https://example.com', 'https://other.example.com']);
});

test('invalid environments, ports, and origins fail at startup', () => {
  for (const env of [{ NODE_ENV: 'prod' }, { PORT: '0' }, { PORT: 'abc' }, { CORS_ORIGINS: '*' }, { CORS_ORIGINS: 'https://example.com/path' }]) {
    assert.throws(() => readConfig(env));
  }
});
