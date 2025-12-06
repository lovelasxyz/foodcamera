import { useEffect, useState, useCallback } from 'react';
import { telegramAuth } from '@/services/telegramAuth';
import { ParsedTelegramUser, AuthStatus, TelegramLoginAuthData } from '@/types/telegram';
import { shouldUseGuestMode } from '@/utils/environment';
import { logDebug } from '@/services/logger';
import { TELEGRAM_CONFIG } from '@/constants/telegram';

interface UseTelegramAuthReturn {
  user: ParsedTelegramUser | null;
  status: AuthStatus;
  error: string | null;
  initData: string | null;
  mode: 'webapp' | 'widget' | 'none';
  isWebAppAvailable: boolean;
  isWidgetAvailable: boolean;
  authenticate: () => Promise<void>;
  handleLoginWidgetAuth: (payload: TelegramLoginAuthData) => Promise<void>;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  sendHapticFeedback: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => void;
}

export const useTelegramAuth = (): UseTelegramAuthReturn => {
  const [user, setUser] = useState<ParsedTelegramUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  const authMode: 'webapp' | 'widget' | 'none' = (() => {
    if (shouldUseGuestMode()) {
      return 'none';
    }
    if (telegramAuth.isAvailable()) {
      return 'webapp';
    }
    if (TELEGRAM_CONFIG.botUsername) {
      return 'widget';
    }
    return 'none';
  })();

  const isWebAppAvailable = authMode === 'webapp';
  const isWidgetAvailable = authMode === 'widget';

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
        setInitData(telegramAuth.getInitData() || null);
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

  const handleLoginWidgetAuth = useCallback(async (payload: TelegramLoginAuthData) => {
    if (shouldUseGuestMode() || !isWidgetAvailable) {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      if (!payload.hash || !payload.auth_date) {
        throw new Error('Invalid Telegram auth payload');
      }

      const widgetUser: ParsedTelegramUser = {
        id: String(payload.id),
        name: [payload.first_name, payload.last_name].filter(Boolean).join(' ') || payload.username || 'User',
        username: payload.username,
        avatar: payload.photo_url,
        isPremium: payload.is_premium,
      };

      // Login Widget: flat format (id, first_name, etc.) - NOT nested user JSON
      const fields: Record<string, string | undefined> = {
        id: String(payload.id),
        auth_date: String(payload.auth_date),
        hash: payload.hash,
        first_name: payload.first_name,
        last_name: payload.last_name,
        username: payload.username,
        photo_url: payload.photo_url,
      };

      const params = new URLSearchParams(
        Object.entries(fields).filter((e): e is [string, string] => e[1] != null)
      );

      setInitData(params.toString());
      setUser(widgetUser);
      setStatus('authenticated');
      logDebug('Telegram login widget authenticated user:', widgetUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to handle Telegram login data';
      setStatus('error');
      setError(message);
      logDebug('Error handling Telegram login widget auth:', err);
    }
  }, [isWidgetAvailable]);

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
    if (authMode === 'webapp' && isWebAppAvailable && status === 'idle' && !shouldUseGuestMode()) {
      // Небольшая задержка для стабилизации WebApp
      const timeoutId = setTimeout(() => {
        authenticate();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [authMode, isWebAppAvailable, status, authenticate]);

  return {
    user,
    status,
    error,
    initData,
    mode: authMode,
    isWebAppAvailable,
    isWidgetAvailable,
    authenticate,
    handleLoginWidgetAuth,
    showAlert,
    showConfirm,
    sendHapticFeedback
  };
}; 