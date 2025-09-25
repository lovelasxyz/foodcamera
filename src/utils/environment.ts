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
 
export const shouldUseGuestMode = (): boolean => {
  // В dev режиме всегда используем guest режим
  if (isDevelopment()) {
    return true;
  }
  
  // В продакшене используем guest режим только если Telegram WebApp недоступен
  return !isTelegramWebApp();
};