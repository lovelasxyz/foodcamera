/**
 * Утилиты для определения окружения
 */

import { TELEGRAM_CONFIG } from '@/constants/telegram';
import { DevLogger } from '@/services/devtools/loggerService';

export const isDevelopment = (): boolean => {
  return (import.meta as any).env?.DEV || process.env.NODE_ENV === 'development';
};
export const isProduction = (): boolean => {
  return (import.meta as any).env?.PROD || process.env.NODE_ENV === 'production';
};

export const isTelegramWebApp = (): boolean => {
  return !!(window.Telegram?.WebApp);
};
 
export const shouldUseGuestMode = (): boolean => {
  const env = (import.meta as any)?.env ?? {};
  const forceGuestRaw = env.VITE_FORCE_GUEST_MODE ?? process.env?.VITE_FORCE_GUEST_MODE;
  const forceGuest = typeof forceGuestRaw === 'string'
    ? forceGuestRaw.trim().toLowerCase() === 'true'
    : Boolean(forceGuestRaw);

  if (forceGuest) {
    DevLogger.logInfo('[Environment] Guest mode FORCED via VITE_FORCE_GUEST_MODE=true');
    return true;
  }

  const useApiRaw = env.VITE_USE_API ?? process.env?.VITE_USE_API;
  const useApi = typeof useApiRaw === 'string'
    ? useApiRaw.trim().toLowerCase() === 'true'
    : Boolean(useApiRaw);

  DevLogger.logInfo('[Environment] shouldUseGuestMode check', {
    useApiRaw,
    useApi,
    forceGuest,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR'
  });

  if (useApi) {
    DevLogger.logInfo('[Environment] API is enabled (VITE_USE_API=true), guest mode = FALSE');
    return false;
  }

  if (typeof window === 'undefined') {
    DevLogger.logInfo('[Environment] SSR mode, guest mode = TRUE');
    return true;
  }

  // Always use guest mode when running on localhost (developer convenience)
  // BUT this is now AFTER the useApi check, so explicit VITE_USE_API=true takes precedence
  try {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost')) {
      DevLogger.logInfo('[Environment] Running on localhost, guest mode = TRUE (fallback)');
      return true;
    }
  } catch {
    // ignore any access errors and proceed with normal detection
  }

  if (isTelegramWebApp()) {
    DevLogger.logInfo('[Environment] Running in Telegram WebApp, guest mode = FALSE');
    return false;
  }

  const hasLoginWidget = Boolean(TELEGRAM_CONFIG.botUsername);
  const result = !hasLoginWidget;
  DevLogger.logInfo('[Environment] Final guest mode decision', { result, reason: 'no login widget' });
  return result;
};