import Availability from '../models/Availability.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';

// GET /api/availability/me
export const getMyAvailability = asyncHandler(async (req, res) => {
  const found = await Availability.findOne({ provider: req.provider._id });
  sendSuccess(res, found || { weekly: [], slotMinutes: 60, daysOff: [] });
});

// PUT /api/availability/me  (replaces the whole schedule)
export const saveMyAvailability = asyncHandler(async (req, res) => {
  const { weekly, slotMinutes, daysOff = [] } = req.body;
  const saved = await Availability.findOneAndUpdate(
    { provider: req.provider._id },
    { weekly, slotMinutes, daysOff: [...new Set(daysOff)].sort() },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  sendSuccess(res, saved, { message: 'Availability saved' });
});
