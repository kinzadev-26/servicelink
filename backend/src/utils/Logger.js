const quiet = () => process.env.NODE_ENV === 'test';
const stamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => { if (!quiet()) console.log(stamp(), 'INFO ', ...args); },
  warn: (...args) => { if (!quiet()) console.warn(stamp(), 'WARN ', ...args); },
  error: (...args) => { if (!quiet()) console.error(stamp(), 'ERROR', ...args); },
};