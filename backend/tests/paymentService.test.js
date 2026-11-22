import { checkPaymentMove } from '../src/services/paymentService.js';

const base = { method: 'transfer', from: 'unpaid', bookingStatus: 'confirmed' };

describe('checkPaymentMove', () => {
  test('customer submits a transfer payment', () => {
    expect(checkPaymentMove({ ...base, actor: 'customer', action: 'submit' })).toEqual({ ok: true, to: 'submitted' });
  });
  test('customer can submit while the booking is still pending', () => {
    expect(checkPaymentMove({ ...base, bookingStatus: 'pending', actor: 'customer', action: 'submit' }).ok).toBe(true);
  });
  test('cash bookings cannot be "submitted" online', () => {
    expect(checkPaymentMove({ ...base, method: 'cash', actor: 'customer', action: 'submit' })).toMatchObject({ ok: false, status: 400 });
  });
  test('customer cannot submit twice', () => {
    expect(checkPaymentMove({ ...base, from: 'submitted', actor: 'customer', action: 'submit' })).toMatchObject({ ok: false, status: 400 });
  });
  test('customer cannot confirm or reject (403)', () => {
    expect(checkPaymentMove({ ...base, from: 'submitted', actor: 'customer', action: 'confirm' }).status).toBe(403);
    expect(checkPaymentMove({ ...base, from: 'submitted', actor: 'customer', action: 'reject' }).status).toBe(403);
  });
  test('provider confirms a submitted payment', () => {
    expect(checkPaymentMove({ ...base, from: 'submitted', actor: 'provider', action: 'confirm' })).toEqual({ ok: true, to: 'paid' });
  });
  test('provider marks cash as received after confirming the booking', () => {
    expect(checkPaymentMove({ method: 'cash', from: 'unpaid', bookingStatus: 'completed', actor: 'provider', action: 'confirm' }).ok).toBe(true);
  });
  test('provider cannot mark paid while the booking is pending', () => {
    expect(checkPaymentMove({ ...base, bookingStatus: 'pending', actor: 'provider', action: 'confirm' })).toMatchObject({ ok: false, status: 400 });
  });
  test('provider rejects a submitted payment, which returns to unpaid', () => {
    expect(checkPaymentMove({ ...base, from: 'submitted', actor: 'provider', action: 'reject' })).toEqual({ ok: true, to: 'unpaid' });
  });
  test('provider cannot reject when nothing was submitted', () => {
    expect(checkPaymentMove({ ...base, actor: 'provider', action: 'reject' }).status).toBe(400);
  });
  test('provider cannot submit for the customer (403)', () => {
    expect(checkPaymentMove({ ...base, actor: 'provider', action: 'submit' }).status).toBe(403);
  });
  test('a paid booking is final', () => {
    expect(checkPaymentMove({ ...base, from: 'paid', actor: 'provider', action: 'confirm' }).status).toBe(400);
  });
  test('no payment changes on cancelled or rejected bookings', () => {
    for (const bookingStatus of ['cancelled', 'rejected']) {
      expect(checkPaymentMove({ ...base, bookingStatus, actor: 'customer', action: 'submit' }).status).toBe(400);
    }
  });
});
