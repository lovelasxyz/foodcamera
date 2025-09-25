/**
 * Утилиты для определения окружения
 */

export const isDevelopment = (): boolean => {
  return (import.meta as any).env?.DEV || process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return (import.meta as any).env?.PROD || process.env.NODE_ENV === 'production';
};

export const isTelegramWebApp = (): boolean => {
  return !!(window.Telegram?.WebApp);
};

/**
 * Причина выбора guest режима (для диагностики)
 */
export const getGuestModeReason = (): string | null => {
  const env = (import.meta as any).env || {};
  if (env?.VITE_FORCE_GUEST === 'true') return 'VITE_FORCE_GUEST=true';
  if (isDevelopment() && env?.VITE_TELEGRAM_DEV_AUTH !== 'true') return 'development (auth disabled)';
  if (!isTelegramWebApp()) return 'Telegram WebApp not detected (window.Telegram.WebApp missing)';
  return null; // не гостевой режим
};

/**
 * Логика определения guest режима с возможностью переопределения через переменные окружения.
 *
 * Переменные:
 *  - VITE_FORCE_GUEST=true       принудительно включает guest режим
 *  - VITE_TELEGRAM_DEV_AUTH=true разрешает Telegram auth в DEV
 */
export const shouldUseGuestMode = (): boolean => {
  const reason = getGuestModeReason();
  return reason !== null;
};