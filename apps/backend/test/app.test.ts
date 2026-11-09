import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.ts';

const app = createApp(['https://flick.f-l.dev']);
const server = app.listen(0, '127.0.0.1');
let baseUrl: string;

before(async () => {
  if (!server.listening) await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

test('health endpoint reports readiness', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'backend' });
});

test('hello endpoint supplies the frontend message', async () => {
  const response = await fetch(`${baseUrl}/api/hello`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: 'Hello from Express!' });
});

test('unknown routes return a JSON 404', async () => {
  const response = await fetch(`${baseUrl}/missing`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Not found' });
});

test('API allows requests from the production frontend', async () => {
  const response = await fetch(`${baseUrl}/api/hello`, { headers: { Origin: 'https://flick.f-l.dev' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://flick.f-l.dev');
  assert.match(response.headers.get('vary') ?? '', /Origin/);
});

test('API does not grant CORS access to other origins', async () => {
  for (const origin of ['https://example.com', 'http://localhost:4000']) {
    const response = await fetch(`${baseUrl}/api/hello`, { headers: { Origin: origin } });
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
});

test('API answers CORS preflight requests', async () => {
  const response = await fetch(`${baseUrl}/api/hello`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://flick.f-l.dev', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type' },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://flick.f-l.dev');
  assert.match(response.headers.get('access-control-allow-methods') ?? '', /GET/);
  assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
});
