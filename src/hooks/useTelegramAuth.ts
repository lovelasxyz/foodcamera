import { useEffect, useState, useCallback } from 'react';
import { telegramAuth } from '@/services/telegramAuth';
import { ParsedTelegramUser, AuthStatus } from '@/types/telegram';
import { shouldUseGuestMode } from '@/utils/environment';
import { logDebug } from '@/services/logger';

interface UseTelegramAuthReturn {
  user: ParsedTelegramUser | null;
  status: AuthStatus;
  error: string | null;
  isWebAppAvailable: boolean;
  authenticate: () => Promise<void>;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  sendHapticFeedback: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => void;
}

export const useTelegramAuth = (): UseTelegramAuthReturn => {
  const [user, setUser] = useState<ParsedTelegramUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isWebAppAvailable] = useState(() => telegramAuth.isAvailable());

  const authenticate = useCallback(async () => {
    // В guest режиме не пытаемся авторизоваться
    if (shouldUseGuestMode()) {
      if (process.env.NODE_ENV === 'development') logDebug('Guest mode - skipping Telegram authentication');
      setStatus('idle');
      return;
    }

    if (!isWebAppAvailable) {
      // Если Telegram WebApp недоступен, просто завершаем без ошибки
      if (process.env.NODE_ENV === 'development') logDebug('Telegram WebApp is not available - running in fallback mode');
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const authenticatedUser = await telegramAuth.authenticate();
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
  setStatus('authenticated');
  if (process.env.NODE_ENV === 'development') logDebug('User authenticated successfully:', authenticatedUser);
      } else {
  // Если нет данных пользователя, но WebApp доступен, это ошибка
  if (process.env.NODE_ENV === 'development') logDebug('No user data available from Telegram WebApp');
        setStatus('error');
        setError('No Telegram initialization data available');
      }
    } catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setStatus('error');
      setError(errorMessage);
  if (process.env.NODE_ENV === 'development') logDebug('Authentication error:', err);
    }
  }, [isWebAppAvailable]);

  const showAlert = useCallback((message: string) => {
    if (!isWebAppAvailable) {
      alert(message);
      return Promise.resolve();
    }
    return telegramAuth.showAlert(message);
  }, [isWebAppAvailable]);

  const showConfirm = useCallback((message: string) => {
    if (!isWebAppAvailable) {
      return Promise.resolve(confirm(message));
    }
    return telegramAuth.showConfirm(message);
  }, [isWebAppAvailable]);

  const sendHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') => {
    if (isWebAppAvailable) {
      telegramAuth.sendHapticFeedback(type);
    }
  }, [isWebAppAvailable]);

  // Автоматическая авторизация при загрузке (только если WebApp доступен и не guest режим)
  useEffect(() => {
    if (isWebAppAvailable && status === 'idle' && !shouldUseGuestMode()) {
      // Небольшая задержка для стабилизации WebApp
      const timeoutId = setTimeout(() => {
        authenticate();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isWebAppAvailable, status, authenticate]);

  return {
    user,
    status,
    error,
    isWebAppAvailable,
    authenticate,
    showAlert,
    showConfirm,
    sendHapticFeedback
  };
}; 