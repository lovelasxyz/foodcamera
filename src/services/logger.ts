import { DevLogger } from '@/services/devtools/loggerService';

export const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug(...args);
  }
  try {
    const message = typeof args[0] === 'string' ? args[0] : 'debug';
    const rest = args.slice(1);
    DevLogger.log('debug', message, rest.length ? { args: rest } : undefined);
  } catch { /* ignore */ }
};
