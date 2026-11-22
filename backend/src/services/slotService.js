// Slot logic as plain functions with no Express or database code inside,
// so Jest can test them with ordinary inputs (see tests/slotService.test.js).
import { addDays, fromMinutes, isValidDate, karachiNow, toMinutes, weekdayOf } from '../utils/time.js';

export const MAX_DAYS_AHEAD = 30; // AVL-4
export const MIN_NOTICE_MINUTES = 120; // AVL-6

// 10:00 to 14:00 with 60-minute slots -> 10:00, 11:00, 12:00, 13:00. A slot that would run past the end is dropped.
export function splitIntoSlots(startTime, endTime, slotMinutes) {
  const slots = [];
  for (let s = toMinutes(startTime); s + slotMinutes <= toMinutes(endTime); s += slotMinutes) {
    slots.push({ startTime: fromMinutes(s), endTime: fromMinutes(s + slotMinutes) });
  }
  return slots;
}

// Two time ranges overlap when each one starts before the other ends.
export const overlaps = (a, b) =>
  toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);

/**
 * Free slots for one provider on one date (AVL-3).
 *  availability: { weekly: [{ dayOfWeek, startTime, endTime }], slotMinutes, daysOff: ['2026-11-20'] }
 *  bookings:     active (pending or confirmed) bookings of that provider on that date
 *  now:          the current moment (a parameter so tests can fix it)
 */
export function getFreeSlots({ date, availability, bookings = [], now = new Date() }) {
  if (!availability || !isValidDate(date)) return [];

  const today = karachiNow(now);
  if (date < today.date || date > addDays(today.date, MAX_DAYS_AHEAD)) return [];
  if ((availability.daysOff || []).includes(date)) return [];

  const rules = (availability.weekly || []).filter((r) => r.dayOfWeek === weekdayOf(date));
  if (rules.length === 0) return [];

  let slots = rules
    .flatMap((r) => splitIntoSlots(r.startTime, r.endTime, availability.slotMinutes))
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  // Today only: drop slots that already started or begin inside the minimum-notice window.
  if (date === today.date) {
    slots = slots.filter((s) => toMinutes(s.startTime) >= today.minutes + MIN_NOTICE_MINUTES);
  }

  return slots.filter((s) => !bookings.some((b) => overlaps(s, b)));
}

// Checks a provider's weekly rules before saving. Returns an error message, or null when fine.
export function validateWeekly(weekly = []) {
  for (const rule of weekly) {
    if (toMinutes(rule.endTime) <= toMinutes(rule.startTime)) {
      return 'Each working period must end after it starts';
    }
  }
  for (let i = 0; i < weekly.length; i += 1) {
    for (let j = i + 1; j < weekly.length; j += 1) {
      if (weekly[i].dayOfWeek === weekly[j].dayOfWeek && overlaps(weekly[i], weekly[j])) {
        return 'Working periods on the same day must not overlap';
      }
    }
  }
  return null;
}
