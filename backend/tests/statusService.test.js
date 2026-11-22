import { checkStatusMove } from '../src/services/statusService.js';

const NOW = new Date('2026-11-20T08:00:00Z'); // 13:00 Karachi
const base = { date: '2026-11-20', startTime: '10:00', now: NOW };

describe('checkStatusMove', () => {
  test('provider can confirm or reject a pending booking', () => {
    expect(checkStatusMove({ ...base, from: 'pending', to: 'confirmed', actor: 'provider' }).ok).toBe(true);
    expect(checkStatusMove({ ...base, from: 'pending', to: 'rejected', actor: 'provider' }).ok).toBe(true);
  });
  test('customer cannot confirm (403)', () => {
    const r = checkStatusMove({ ...base, from: 'pending', to: 'confirmed', actor: 'customer' });
    expect(r).toMatchObject({ ok: false, status: 403 });
  });
  test('customer can cancel pending and confirmed bookings', () => {
    expect(checkStatusMove({ ...base, from: 'pending', to: 'cancelled', actor: 'customer' }).ok).toBe(true);
    expect(checkStatusMove({ ...base, from: 'confirmed', to: 'cancelled', actor: 'customer' }).ok).toBe(true);
  });
  test('provider cannot cancel a pending booking (reject it instead)', () => {
    expect(checkStatusMove({ ...base, from: 'pending', to: 'cancelled', actor: 'provider' }).status).toBe(403);
  });
  test('finished bookings cannot change (400)', () => {
    for (const from of ['completed', 'rejected', 'cancelled']) {
      expect(checkStatusMove({ ...base, from, to: 'confirmed', actor: 'provider' })).toMatchObject({ ok: false, status: 400 });
    }
  });
  test('cannot skip steps: pending to completed is refused', () => {
    expect(checkStatusMove({ ...base, from: 'pending', to: 'completed', actor: 'provider' }).status).toBe(400);
  });
  test('completed is allowed after the start time', () => {
    expect(checkStatusMove({ ...base, from: 'confirmed', to: 'completed', actor: 'provider' }).ok).toBe(true);
  });
  test('completed is refused before the start time', () => {
    const r = checkStatusMove({ ...base, startTime: '18:00', from: 'confirmed', to: 'completed', actor: 'provider' });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });
});
