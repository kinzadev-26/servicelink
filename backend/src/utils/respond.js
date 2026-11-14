// One response shape for every success: { success, message, data, meta? }
export function sendSuccess(res, data, { message = 'OK', status = 200, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
