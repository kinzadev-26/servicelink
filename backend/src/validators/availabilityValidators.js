import { body } from 'express-validator';
import { validateWeekly } from '../services/slotService.js';
import { DATE_RE, TIME_RE, isValidDate } from '../utils/time.js';

export const availabilityRules = [
  body('weekly').isArray({ max: 28 }).withMessage('weekly must be a list of working periods'),
  body('weekly.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek must be 0 (Sunday) to 6 (Saturday)').toInt(),
  body('weekly.*.startTime').matches(TIME_RE).withMessage('Start time must look like 10:00'),
  body('weekly.*.endTime').matches(TIME_RE).withMessage('End time must look like 18:00'),
  body('weekly').custom((weekly) => {
    const problem = validateWeekly(weekly);
    if (problem) throw new Error(problem);
    return true;
  }),
  body('slotMinutes').isIn([30, 45, 60, 90, 120, 180]).withMessage('Slot length must be 30, 45, 60, 90, 120 or 180 minutes').toInt(),
  body('daysOff').optional().isArray({ max: 100 }).withMessage('daysOff must be a list of dates'),
  body('daysOff.*').matches(DATE_RE).custom(isValidDate).withMessage('Each day off must be a real date like 2026-11-20'),
];
