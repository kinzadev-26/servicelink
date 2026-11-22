// Real Socket.IO server and real clients on a local port. Only the User model is faked (no database needed).
import { jest } from '@jest/globals';
import http from 'http';
import { io as connect } from 'socket.io-client';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/unused';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const users = {
  u1: { _id: 'u1', role: 'customer', isActive: true },
  u2: { _id: 'u2', role: 'provider', isActive: true },
  u3: { _id: 'u3', role: 'customer', isActive: false },
};
jest.unstable_mockModule('../src/models/User.js', () => ({
  default: { findById: (id) => ({ select: async () => users[id] || null }) },
}));

const { initSocket, emitToUser, closeSocket } = await import('../src/socket.js');
const { signToken } = await import('../src/utils/token.js');

let server, url;
const clients = [];
const open = (token) =>
  new Promise((resolve, reject) => {
    const c = connect(url, { auth: token ? { token } : {}, transports: ['websocket'], reconnection: false });
    clients.push(c);
    c.on('connect', () => resolve(c));
    c.on('connect_error', (err) => reject(err));
  });
const nextEvent = (c, name) => new Promise((resolve) => c.once(name, resolve));

beforeAll(async () => {
  server = http.createServer();
  initSocket(server);
  await new Promise((r) => server.listen(0, r));
  url = `http://localhost:${server.address().port}`;
});
afterAll(async () => {
  clients.forEach((c) => c.close());
  closeSocket();
  await new Promise((r) => server.close(r));
});

describe('socket authentication', () => {
  test('refuses a connection with no token', async () => {
    await expect(open(null)).rejects.toThrow('Authentication required');
  });
  test('refuses a garbage token', async () => {
    await expect(open('abc.def.ghi')).rejects.toThrow('Invalid or expired token');
  });
  test('refuses a suspended account', async () => {
    await expect(open(signToken(users.u3))).rejects.toThrow('Account unavailable');
  });
  test('accepts a valid token', async () => {
    const c = await open(signToken(users.u1));
    expect(c.connected).toBe(true);
  });
});

describe('live delivery', () => {
  test('an event reaches only the intended user', async () => {
    const a = await open(signToken(users.u1));
    const b = await open(signToken(users.u2));
    let aGotIt = false;
    a.on('notification', () => { aGotIt = true; });
    const received = nextEvent(b, 'notification');
    emitToUser('u2', 'notification', { title: 'New booking request' });
    expect((await received).title).toBe('New booking request');
    await new Promise((r) => setTimeout(r, 100));
    expect(aGotIt).toBe(false);
  });
  test('every open tab of the same user gets it', async () => {
    const t1 = await open(signToken(users.u1));
    const t2 = await open(signToken(users.u1));
    const both = Promise.all([nextEvent(t1, 'message:new'), nextEvent(t2, 'message:new')]);
    emitToUser('u1', 'message:new', { text: 'hello' });
    const [m1, m2] = await both;
    expect([m1.text, m2.text]).toEqual(['hello', 'hello']);
  });
  test('emitting to someone who is offline does nothing and does not throw', () => {
    expect(() => emitToUser('nobody', 'notification', {})).not.toThrow();
  });
});
