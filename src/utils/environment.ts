/**
 * Утилиты для определения окружения
 */

import { TELEGRAM_CONFIG } from '@/constants/telegram';
import { DevLogger } from '@/services/devtools/loggerService';

export const isDevelopment = (): boolean => {
  return (import.meta as any).env?.DEV || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
};

export const isProduction = (): boolean => {
  return (import.meta as any).env?.PROD || (typeof process !== 'undefined' && process.env.NODE_ENV === 'production');
};

export const isTelegramWebApp = (): boolean => {
  return !!(window.Telegram?.WebApp);
};

/**
 * Определяет, нужно ли использовать Guest Mode (пропуск Telegram авторизации).
 * 
 * ВАЖНО: Guest Mode НЕ означает использование mock данных!
 * Guest Mode = пропуск Telegram WebApp авторизации, но данные всё равно
 * сохраняются на сервере (если API включен).
 * 
 * Для mock данных используется отдельная настройка VITE_USE_MOCKS или VITE_USE_API=false.
 */
export const shouldUseGuestMode = (): boolean => {
  const env = (import.meta as any)?.env ?? {};
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  
  // 1. Явное указание VITE_FORCE_GUEST_MODE=true
  const forceGuestRaw = env.VITE_FORCE_GUEST_MODE ?? processEnv?.VITE_FORCE_GUEST_MODE;
  const forceGuest = typeof forceGuestRaw === 'string'
    ? forceGuestRaw.trim().toLowerCase() === 'true'
    : Boolean(forceGuestRaw);

  if (forceGuest) {
    DevLogger.logInfo('[Environment] Guest mode FORCED via VITE_FORCE_GUEST_MODE=true');
    return true;
  }

  // 2. SSR режим - всегда guest
  if (typeof window === 'undefined') {
    DevLogger.logInfo('[Environment] SSR mode, guest mode = TRUE');
    return true;
  }

  // 3. Localhost без Telegram WebApp - guest mode для удобства разработки
  try {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost');
    
    if (isLocalhost && !isTelegramWebApp()) {
      DevLogger.logInfo('[Environment] Running on localhost without Telegram WebApp, guest mode = TRUE');
      return true;
    }
  } catch {
    // ignore access errors
  }

  // 4. Telegram WebApp доступен - НЕ guest mode
  if (isTelegramWebApp()) {
    DevLogger.logInfo('[Environment] Running in Telegram WebApp, guest mode = FALSE');
    return false;
  }

  // 5. Есть Login Widget - НЕ guest mode
  const hasLoginWidget = Boolean(TELEGRAM_CONFIG.botUsername);
  const result = !hasLoginWidget;
  DevLogger.logInfo('[Environment] Final guest mode decision', { result, hasLoginWidget });
  return result;
};

/**
 * Проверяет, нужно ли выполнить guest авторизацию на бэкенде.
 * Отличается от shouldUseGuestMode() тем, что проверяет наличие токена.
 */
export const needsGuestAuth = (): boolean => {
  if (!shouldUseGuestMode()) {
    return false;
  }
  
  // Проверяем есть ли сохранённый токен
  try {
    const token = window.localStorage.getItem('app_token_v2');
    if (token && token.length > 10) {
      DevLogger.logInfo('[Environment] Guest mode but token exists, no auth needed');
      return false;
    }
  } catch {
    // localStorage недоступен
  }
  
  DevLogger.logInfo('[Environment] Guest mode and no token, needs guest auth');
  return true;
}; 