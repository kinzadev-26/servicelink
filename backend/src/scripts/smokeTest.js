const base = (process.argv[2] || process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:5173';
const email = process.env.SMOKE_EMAIL || 'customer@example.com';
const password = process.env.SMOKE_PASSWORD || 'Password123';

const results = [];
let token = '';
let providerId = '';

async function call(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(auth && { Authorization: `Bearer ${token}` }), ...headers },
    ...(body && { body: JSON.stringify(body) }),
  });
  let json = null;
  try { json = await res.json(); } catch { /* not JSON */ }
  return { res, json };
}

async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail || '', ms: Date.now() - started });
  } catch (err) {
    results.push({ name, ok: false, detail: err.message, ms: Date.now() - started });
  }
}
const expect = (cond, message) => { if (!cond) throw new Error(message); };

console.log(`Smoke test against ${base}\n`);

await check('Health check, API is up', async () => {
  const { res, json } = await call('/health');
  expect(res.status === 200, `status ${res.status}`);
  expect(json?.success === true, 'success is not true');
  return `environment: ${json.data.environment}`;
});
await check('Database is connected', async () => {
  const { json } = await call('/health');
  expect(json?.data?.db === 'connected', `db is "${json?.data?.db}"`);
});
await check('CORS allows the frontend origin', async () => {
  const { res } = await call('/health');
  const allowed = res.headers.get('access-control-allow-origin');
  expect(allowed === origin, `allow-origin is "${allowed}", expected "${origin}". Fix CLIENT_URL on the server.`);
});
await check('Security headers are set (helmet)', async () => {
  const { res } = await call('/health');
  expect(res.headers.get('x-content-type-options') === 'nosniff', 'x-content-type-options missing');
});
await check('READ: categories list', async () => {
  const { res, json } = await call('/categories');
  expect(res.status === 200 && Array.isArray(json?.data), `status ${res.status}`);
  expect(json.data.length > 0, 'no categories. Did you run the seed against this database?');
  return `${json.data.length} categories`;
});
await check('READ: providers list with pagination', async () => {
  const { res, json } = await call('/providers?limit=5');
  expect(res.status === 200, `status ${res.status}`);
  expect(json.meta && typeof json.meta.total === 'number', 'meta.total missing');
  expect(json.data.length > 0, 'no approved providers');
  providerId = json.data[0]._id;
  return `${json.meta.total} providers`;
});
await check('READ: provider detail and slots', async () => {
  expect(providerId, 'no provider id from the previous step');
  const detail = await call(`/providers/${providerId}`);
  expect(detail.res.status === 200, `detail status ${detail.res.status}`);
  const date = new Date(Date.now() + 5 * 3600e3 + 3 * 86400e3).toISOString().slice(0, 10);
  const slots = await call(`/providers/${providerId}/slots?date=${date}`);
  expect(slots.res.status === 200 && Array.isArray(slots.json?.data?.slots), `slots status ${slots.res.status}`);
  return `${slots.json.data.slots.length} slots on ${date}`;
});
await check('ERROR: unknown route returns JSON 404', async () => {
  const { res, json } = await call('/definitely-not-a-route');
  expect(res.status === 404 && json?.success === false, `status ${res.status}`);
});
await check('AUTH: protected route without a token returns 401', async () => {
  const { res } = await call('/bookings');
  expect(res.status === 401, `status ${res.status}`);
});
await check('VALIDATION: bad login body returns 400', async () => {
  const { res } = await call('/auth/login', { method: 'POST', body: {} });
  expect(res.status === 400, `status ${res.status}`);
});
await check('AUTH: wrong password returns 401', async () => {
  const { res } = await call('/auth/login', { method: 'POST', body: { email, password: 'definitely-wrong-1' } });
  expect(res.status === 401, `status ${res.status}`);
});
await check('AUTH: login works', async () => {
  const { res, json } = await call('/auth/login', { method: 'POST', body: { email, password } });
  expect(res.status === 200, `status ${res.status} (is ${email} seeded with this password?)`);
  token = json.data.token;
  expect(typeof token === 'string', 'no token returned');
  expect(!JSON.stringify(json).includes('passwordHash'), 'password hash leaked');
});
await check('AUTH: token opens /auth/me', async () => {
  const { res, json } = await call('/auth/me', { auth: true });
  expect(res.status === 200 && json.data.user.email === email, `status ${res.status}`);
});
await check('AUTHORIZATION: customer is refused on admin route (403)', async () => {
  const { res } = await call('/admin/stats', { auth: true });
  expect(res.status === 403, `status ${res.status}`);
});
await check('READ: own bookings, notifications and chats', async () => {
  for (const path of ['/bookings', '/notifications', '/conversations']) {
    const { res } = await call(path, { auth: true });
    expect(res.status === 200, `${path} status ${res.status}`);
  }
});

const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(width)}  ${String(r.ms).padStart(4)} ms  ${r.detail}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} checks passed.`);
process.exit(failed ? 1 : 0);