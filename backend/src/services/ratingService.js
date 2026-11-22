import Provider from '../models/Provider.js';
import Review from '../models/Review.js';

// REV-3: recompute a provider's average rating and review count from the reviews collection.
// Called after a review is added or removed, so the numbers can never drift.
export async function recalculateRating(providerId) {
  const [stats] = await Review.aggregate([
    { $match: { provider: providerId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avgRating = stats ? Math.round(stats.avg * 10) / 10 : 0;
  const reviewCount = stats ? stats.count : 0;
  await Provider.findByIdAndUpdate(providerId, { avgRating, reviewCount });
  return { avgRating, reviewCount };
}
