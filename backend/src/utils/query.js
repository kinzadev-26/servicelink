// Helpers for reading query-string parameters safely.

export function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50); // SYS-5: max 50
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta({ page, limit }, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}

// Turns user text into a safe, case-insensitive regular expression.
export function textRegex(text, exact = false) {
  const escaped = String(text).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(exact ? `^${escaped}$` : escaped, 'i');
}
