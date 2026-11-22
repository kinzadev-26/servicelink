export const formatPKR = (amount) => `PKR ${Number(amount).toLocaleString('en-PK')}`;

export const formatRating = (rating, count) =>
  count > 0 ? `${Number(rating).toFixed(1)} (${count})` : 'No reviews yet';

// "2026-11-20" -> "Fri, 20 Nov 2026" (built from the parts so the time zone can never shift the day)
export function formatDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// "15:00" -> "3:00 PM"
export function formatTime(time) {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// Today and +30 days in Pakistan time (UTC+5), matching the server's booking window.
export function karachiDate(offsetDays = 0) {
  return new Date(Date.now() + 5 * 3600 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10);
}

// "5 min ago", "2 h ago", "3 d ago"
export function formatAgo(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}
