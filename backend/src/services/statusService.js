// The booking status rules in one place (BKG-5 to BKG-8), again with no database code.
import { startsAt } from '../utils/time.js';

// from -> to -> who may make that move
export const STATUS_MOVES = {
  pending: { confirmed: ['provider'], rejected: ['provider'], cancelled: ['customer'] },
  confirmed: { completed: ['provider'], cancelled: ['customer', 'provider'] },
};

/**
 * Decides whether `actor` ('customer' or 'provider') may move a booking from one status to another.
 * Returns { ok: true } or { ok: false, status, message } where status is the HTTP code to send.
 */
export function checkStatusMove({ from, to, actor, date, startTime, now = new Date() }) {
  const allowedActors = STATUS_MOVES[from]?.[to];
  if (!allowedActors) {
    return { ok: false, status: 400, message: `A ${from} booking cannot be changed to ${to}` };
  }
  if (!allowedActors.includes(actor)) {
    return { ok: false, status: 403, message: `Only the ${allowedActors.join(' or ')} can make this change` };
  }
  // BKG-7: a job cannot be completed before it has started
  if (to === 'completed' && startsAt(date, startTime) > now) {
    return { ok: false, status: 400, message: 'A booking can only be completed on or after its start time' };
  }
  return { ok: true };
}
