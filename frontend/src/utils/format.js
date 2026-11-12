export const formatPKR = (amount) => `PKR ${Number(amount).toLocaleString('en-PK')}`;

export const formatRating = (rating, count) =>
  count > 0 ? `${Number(rating).toFixed(1)} (${count})` : 'No reviews yet';
