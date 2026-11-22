import { getFreeSlots, splitIntoSlots, validateWeekly } from '../src/services/slotService.js';

// 2026-11-20 is a Friday (dayOfWeek 5). "now" is fixed so results never depend on the real clock.
const NOW = new Date('2026-11-18T05:00:00Z'); // 10:00 in Karachi on Wednesday 18 Nov
const availability = {
  weekly: [{ dayOfWeek: 5, startTime: '10:00', endTime: '14:00' }],
  slotMinutes: 60,
  daysOff: [],
};

describe('splitIntoSlots', () => {
  test('cuts a period into equal slots', () => {
    expect(splitIntoSlots('10:00', '13:00', 60).map((s) => s.startTime)).toEqual(['10:00', '11:00', '12:00']);
  });
  test('drops a last slot that would run past the end', () => {
    expect(splitIntoSlots('10:00', '12:30', 60)).toHaveLength(2);
  });
});

describe('getFreeSlots', () => {
  test('returns all slots for a working day', () => {
    expect(getFreeSlots({ date: '2026-11-20', availability, now: NOW })).toHaveLength(4);
  });
  test('removes slots taken by active bookings', () => {
    const bookings = [{ startTime: '11:00', endTime: '12:00' }];
    const starts = getFreeSlots({ date: '2026-11-20', availability, bookings, now: NOW }).map((s) => s.startTime);
    expect(starts).toEqual(['10:00', '12:00', '13:00']);
  });
  test('a longer booking blocks every overlapping slot', () => {
    const bookings = [{ startTime: '10:30', endTime: '12:30' }];
    expect(getFreeSlots({ date: '2026-11-20', availability, bookings, now: NOW }).map((s) => s.startTime)).toEqual(['13:00']);
  });
  test('no slots on a day with no working rule', () => {
    expect(getFreeSlots({ date: '2026-11-21', availability, now: NOW })).toEqual([]); // Saturday
  });
  test('no slots on a day off', () => {
    expect(getFreeSlots({ date: '2026-11-20', availability: { ...availability, daysOff: ['2026-11-20'] }, now: NOW })).toEqual([]);
  });
  test('no slots in the past', () => {
    expect(getFreeSlots({ date: '2026-11-13', availability, now: NOW })).toEqual([]);
  });
  test('no slots more than 30 days ahead', () => {
    expect(getFreeSlots({ date: '2026-12-25', availability, now: NOW })).toEqual([]);
  });
  test('today: hides slots inside the 2-hour notice window', () => {
    const wed = { weekly: [{ dayOfWeek: 3, startTime: '09:00', endTime: '15:00' }], slotMinutes: 60, daysOff: [] };
    // now = 10:00, so the earliest bookable start is 12:00
    expect(getFreeSlots({ date: '2026-11-18', availability: wed, now: NOW })[0].startTime).toBe('12:00');
  });
  test('invalid date or missing availability gives an empty list', () => {
    expect(getFreeSlots({ date: '2026-02-30', availability, now: NOW })).toEqual([]);
    expect(getFreeSlots({ date: '2026-11-20', availability: null, now: NOW })).toEqual([]);
  });
});

describe('validateWeekly', () => {
  test('accepts a normal schedule', () => {
    expect(validateWeekly([{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }, { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' }])).toBeNull();
  });
  test('rejects an end before the start', () => {
    expect(validateWeekly([{ dayOfWeek: 1, startTime: '12:00', endTime: '09:00' }])).toMatch(/end after/);
  });
  test('rejects overlapping periods on one day', () => {
    expect(validateWeekly([{ dayOfWeek: 1, startTime: '09:00', endTime: '13:00' }, { dayOfWeek: 1, startTime: '12:00', endTime: '15:00' }])).toMatch(/overlap/);
  });
});
