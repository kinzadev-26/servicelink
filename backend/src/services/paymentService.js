// Payment rules as a plain function (no database), so they are easy to test.
// A booking's paymentStatus moves: unpaid -> submitted (customer typed the transaction id) -> paid (provider confirmed).
export const PAYMENT_METHODS = ['cash', 'transfer'];

const ok = (to) => ({ ok: true, to });
const no = (status, message) => ({ ok: false, status, message });

// actor: 'customer' | 'provider'    action: 'submit' | 'confirm' | 'reject'
export function checkPaymentMove({ actor, action, method, from, bookingStatus }) {
  if (['rejected', 'cancelled'].includes(bookingStatus)) return no(400, 'Payment cannot change on a rejected or cancelled booking');
  if (from === 'paid') return no(400, 'This booking is already paid');

  if (actor === 'customer') {
    if (action !== 'submit') return no(403, 'Only the provider can confirm or reject a payment');
    if (method !== 'transfer') return no(400, 'Cash bookings are paid to the provider directly');
    if (from !== 'unpaid') return no(400, 'Payment details were already submitted');
    return ok('submitted');
  }

  if (actor === 'provider') {
    if (action === 'submit') return no(403, 'Only the customer can submit payment details');
    if (action === 'confirm') {
      if (bookingStatus === 'pending') return no(400, 'Confirm the booking before marking it as paid');
      return ok('paid');
    }
    if (action === 'reject') {
      if (from !== 'submitted') return no(400, 'There is no submitted payment to reject');
      return ok('unpaid');
    }
  }
  return no(400, 'Unknown payment action');
}
