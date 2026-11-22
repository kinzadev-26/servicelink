// Date and time helpers. Dates are plain "YYYY-MM-DD" strings and times are "HH:MM" strings,
// all in Asia/Karachi time (UTC+5, no daylight saving), as the design document says (NFR-13).
export const KARACHI_OFFSET_MINUTES = 300;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

// "2026-02-30" matches the pattern but is not a real day, so check it round-trips.
export function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Today's date and minutes-since-midnight in Karachi. `now` can be passed in so tests are repeatable.
export function karachiNow(now = new Date()) {
  const k = new Date(now.getTime() + KARACHI_OFFSET_MINUTES * 60000);
  return { date: k.toISOString().slice(0, 10), minutes: k.getUTCHours() * 60 + k.getUTCMinutes() };
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 0 = Sunday ... 6 = Saturday
export const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

// The exact moment a booking starts, as a Date.
export const startsAt = (date, time) => new Date(`${date}T${time}:00+05:00`);
