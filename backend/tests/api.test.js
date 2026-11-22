// HTTP tests that need no database: validation, authentication and role checks.
// The User model is replaced by a fake so authenticate() can run without MongoDB.
import { jest } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/unused';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.CLIENT_URL = 'http://localhost:5173';

const users = {
  customer: { _id: 'c1', name: 'Cus', role: 'customer', isActive: true },
  provider: { _id: 'p1', name: 'Pro', role: 'provider', isActive: true },
  admin: { _id: 'a1', name: 'Adm', role: 'admin', isActive: true },
  suspended: { _id: 's1', name: 'Sus', role: 'customer', isActive: false },
};
jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: (id) => ({ select: async () => Object.values(users).find((u) => u._id === id) || null }),
    exists: async () => null,
    findOne: () => ({ select: async () => null }),
  },
}));

const { default: app } = await import('../src/app.js');
const { signToken } = await import('../src/utils/token.js');
const tokenFor = (u) => signToken(u);
const auth = (u) => ({ Authorization: `Bearer ${tokenFor(u)}` });

describe('health', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  test('unknown route gives a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('registration validation', () => {
  const good = { name: 'Kinza', email: 'k@example.com', password: 'abcd1234' };
  test('rejects a short password with a field error', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...good, password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });
  test('rejects a password without a number', async () => {
    expect((await request(app).post('/api/auth/register').send({ ...good, password: 'abcdefgh' })).status).toBe(400);
  });
  test('rejects a bad email', async () => {
    expect((await request(app).post('/api/auth/register').send({ ...good, email: 'nope' })).status).toBe(400);
  });
  test('nobody can register as admin', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...good, role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'role')).toBe(true);
  });
  test('a provider must give a city', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...good, role: 'provider' });
    expect(res.status).toBe(400);
  });
  test('login needs email and password', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400);
  });
});

describe('authentication (401)', () => {
  test.each([
    ['get', '/api/auth/me'],
    ['get', '/api/bookings'],
    ['post', '/api/bookings'],
    ['get', '/api/availability/me'],
    ['get', '/api/admin/stats'],
    ['post', '/api/services'],
    ['post', '/api/categories'],
    ['get', '/api/conversations'],
    ['get', '/api/notifications'],
    ['patch', '/api/notifications/read-all'],
  ])('%s %s without a token', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  test('garbage token', async () => {
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi')).status).toBe(401);
  });
  test('wrong scheme', async () => {
    expect((await request(app).get('/api/auth/me').set('Authorization', `Token ${tokenFor(users.customer)}`)).status).toBe(401);
  });
  test('token for a user that no longer exists', async () => {
    expect((await request(app).get('/api/bookings').set(auth({ _id: 'gone', role: 'customer' }))).status).toBe(401);
  });
  test('suspended account gets 403', async () => {
    expect((await request(app).get('/api/bookings').set(auth(users.suspended))).status).toBe(403);
  });
});

describe('role-based access (403)', () => {
  test('customer cannot open admin routes', async () => {
    expect((await request(app).get('/api/admin/stats').set(auth(users.customer))).status).toBe(403);
  });
  test('provider cannot create a booking', async () => {
    expect((await request(app).post('/api/bookings').set(auth(users.provider)).send({})).status).toBe(403);
  });
  test('customer cannot add a service', async () => {
    expect((await request(app).post('/api/services').set(auth(users.customer)).send({})).status).toBe(403);
  });
  test('customer cannot edit availability', async () => {
    expect((await request(app).put('/api/availability/me').set(auth(users.customer)).send({})).status).toBe(403);
  });
  test('provider cannot create a category', async () => {
    expect((await request(app).post('/api/categories').set(auth(users.provider)).send({ name: 'X' })).status).toBe(403);
  });
  test('provider cannot review', async () => {
    expect((await request(app).post('/api/bookings/64b000000000000000000001/review').set(auth(users.provider)).send({ rating: 5 })).status).toBe(403);
  });
  test('only admin can delete reviews', async () => {
    expect((await request(app).delete('/api/reviews/64b000000000000000000001').set(auth(users.customer))).status).toBe(403);
  });
});

describe('validation after login (400)', () => {
  test('booking needs a real service id, date and time', async () => {
    const res = await request(app).post('/api/bookings').set(auth(users.customer)).send({ service: 'abc', date: '20-11-2026', startTime: '25:00' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['service', 'date', 'startTime']));
  });
  test('status change rejects an unknown status', async () => {
    const res = await request(app).patch('/api/bookings/64b000000000000000000001/status').set(auth(users.customer)).send({ status: 'banana' });
    expect(res.status).toBe(400);
  });
  test('review rating must be 1 to 5', async () => {
    const res = await request(app).post('/api/bookings/64b000000000000000000001/review').set(auth(users.customer)).send({ rating: 9 });
    expect(res.status).toBe(400);
  });
  test('invalid id in the URL gives 400, not a crash', async () => {
    expect((await request(app).get('/api/bookings/xyz').set(auth(users.customer))).status).toBe(400);
  });
  test('slots endpoint needs a valid date', async () => {
    expect((await request(app).get('/api/providers/64b000000000000000000001/slots?date=tomorrow')).status).toBe(400);
  });
});

describe('messaging and notifications', () => {
  test('admins cannot use messaging (403)', async () => {
    expect((await request(app).get('/api/conversations').set(auth(users.admin))).status).toBe(403);
  });
  test('a provider can only start a chat with a customer id (400)', async () => {
    expect((await request(app).post('/api/conversations').set(auth(users.provider)).send({ provider: '64b000000000000000000001' })).status).toBe(400);
  });
  test('a chat needs a provider or a customer id (400)', async () => {
    expect((await request(app).post('/api/conversations').set(auth(users.customer)).send({})).status).toBe(400);
  });
  test('starting a conversation needs a valid provider id (400)', async () => {
    expect((await request(app).post('/api/conversations').set(auth(users.customer)).send({ provider: 'abc' })).status).toBe(400);
  });
  test('an empty message is refused (400)', async () => {
    const res = await request(app).post('/api/conversations/64b000000000000000000001/messages').set(auth(users.customer)).send({ text: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'text')).toBe(true);
  });
  test('a message over 1000 characters is refused (400)', async () => {
    const res = await request(app).post('/api/conversations/64b000000000000000000001/messages').set(auth(users.customer)).send({ text: 'a'.repeat(1001) });
    expect(res.status).toBe(400);
  });
  test('a bad conversation id is refused (400)', async () => {
    expect((await request(app).get('/api/conversations/xyz/messages').set(auth(users.customer))).status).toBe(400);
  });
  test('a bad notification id is refused (400)', async () => {
    expect((await request(app).patch('/api/notifications/xyz/read').set(auth(users.customer))).status).toBe(400);
  });
});

describe('payments and the booking message', () => {
  const id = '64b000000000000000000001';
  test('payment route needs a login (401)', async () => {
    expect((await request(app).patch(`/api/bookings/${id}/payment`).send({ action: 'confirm' })).status).toBe(401);
  });
  test('admin cannot change payments (403)', async () => {
    expect((await request(app).patch(`/api/bookings/${id}/payment`).set(auth(users.admin)).send({ action: 'confirm' })).status).toBe(403);
  });
  test('unknown payment action (400)', async () => {
    expect((await request(app).patch(`/api/bookings/${id}/payment`).set(auth(users.customer)).send({ action: 'steal' })).status).toBe(400);
  });
  test('submitting needs a transaction id (400)', async () => {
    const res = await request(app).patch(`/api/bookings/${id}/payment`).set(auth(users.customer)).send({ action: 'submit' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'reference')).toBe(true);
  });
  test('booking with an unknown payment method (400)', async () => {
    const res = await request(app).post('/api/bookings').set(auth(users.customer)).send({ service: id, date: '2026-12-01', startTime: '10:00', paymentMethod: 'bitcoin' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'paymentMethod')).toBe(true);
  });
  test('booking message over 1000 characters (400)', async () => {
    const res = await request(app).post('/api/bookings').set(auth(users.customer)).send({ service: id, date: '2026-12-01', startTime: '10:00', message: 'a'.repeat(1001) });
    expect(res.status).toBe(400);
  });
  test('provider payment account is too long (400)', async () => {
    const res = await request(app).put('/api/providers/me').set(auth(users.provider)).send({ paymentAccounts: { easypaisa: '0'.repeat(41) } });
    expect(res.status).toBe(400);
  });
});
