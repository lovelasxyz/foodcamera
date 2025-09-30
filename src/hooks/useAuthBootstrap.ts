import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { shouldUseGuestMode } from '@/utils/environment';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { ParsedTelegramUser } from '@/types/telegram';

interface AuthBootstrapState {
  initializing: boolean;
  showLoading: boolean;
  initialized: boolean;
}

// Минимальное время показа загрузочного экрана (в мс)
const MIN_LOADING_TIME = 1500;

// Encapsulates previous auth/bootstrap logic from App.tsx
export function useAuthBootstrap(): AuthBootstrapState {
  const { setTelegramUser, loadUser } = useUserStore();
  const { user: telegramUser, status: authStatus } = useTelegramAuth();
  const [initialized, setInitialized] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [loadingStartTime] = useState(() => Date.now());

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
    if (shouldUseGuestMode()) {
      hideLoadingWithDelay();
      return;
    }
    if (telegramUser && authStatus === 'authenticated') {
      setTelegramUser(telegramUser as ParsedTelegramUser);
      hideLoadingWithDelay();
    } else if (authStatus === 'error' || authStatus === 'loading') {
      setShowLoading(true);
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
  }, [telegramUser, authStatus, setTelegramUser, initialized]);

  useEffect(() => {
    if (shouldUseGuestMode()) {
      void loadUser();
    }
  }, [loadUser]);

  return { initializing: !initialized, showLoading, initialized };
}
