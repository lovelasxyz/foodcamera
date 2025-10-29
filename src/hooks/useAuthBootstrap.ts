import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { shouldUseGuestMode } from '@/utils/environment';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { ParsedTelegramUser } from '@/types/telegram';
import { apiService } from '@/services/apiService';
import { telegramAuth } from '@/services/telegramAuth';

interface AuthBootstrapState {
  initializing: boolean;
  showLoading: boolean;
  initialized: boolean;
}

// Минимальное время показа загрузочного экрана (в мс)
const MIN_LOADING_TIME = 1500;

// Encapsulates previous auth/bootstrap logic from App.tsx
export function useAuthBootstrap(): AuthBootstrapState {
  const { setTelegramUser, loadUser, setError: setUserError, setLoading: setUserLoading } = useUserStore();
  const { user: telegramUser, status: authStatus, error: authError } = useTelegramAuth();
  const [initialized, setInitialized] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [loadingStartTime] = useState(() => Date.now());
  const backendAuthInFlight = useRef(false);
  const guestMode = shouldUseGuestMode();

  // Функция для скрытия загрузки с учётом минимального времени
  const hideLoadingWithDelay = () => {
    const elapsed = Date.now() - loadingStartTime;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

    setTimeout(() => {
      setInitialized(true);
      setShowLoading(false);
    }, remainingTime);
  };

  useEffect(() => {
    if (guestMode) {
      hideLoadingWithDelay();
      return;
    }
    if (telegramUser && authStatus === 'authenticated') {
      setTelegramUser(telegramUser as ParsedTelegramUser);

      if (!backendAuthInFlight.current) {
        backendAuthInFlight.current = true;
        setShowLoading(true);
        setUserLoading(true);
        const initData = telegramAuth.getInitData();

        void (async () => {
          try {
            await apiService.authWithTelegram(initData);
            await loadUser();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to authenticate with server';
            setUserError(message);
          } finally {
            setUserLoading(false);
            hideLoadingWithDelay();
          }
        })();
      }
    } else if (authStatus === 'error' || authStatus === 'loading') {
      setShowLoading(true);
      if (authStatus === 'error') {
        if (authError) {
          setUserError(authError);
        }
        setUserLoading(false);
        hideLoadingWithDelay();
      }
    } else if (authStatus === 'idle') {
      const timeoutId = setTimeout(() => {
        if (!initialized) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('Auth timeout - proceeding without Telegram auth');
          }
          hideLoadingWithDelay();
        }
      }, 1200);
      return () => clearTimeout(timeoutId);
    }
  }, [telegramUser, authStatus, authError, setTelegramUser, loadUser, setUserError, setUserLoading, initialized, guestMode]);

  useEffect(() => {
    if (guestMode) {
      void loadUser();
    }
  }, [guestMode, loadUser]);

  return { initializing: !initialized, showLoading, initialized };
}
