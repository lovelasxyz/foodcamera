/**
 * Утилиты для определения окружения
 */

import { TELEGRAM_CONFIG } from '@/constants/telegram';

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
    return true;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  if (isTelegramWebApp()) {
    return false;
  }

  const hasLoginWidget = Boolean(TELEGRAM_CONFIG.botUsername);
  return !hasLoginWidget;
};