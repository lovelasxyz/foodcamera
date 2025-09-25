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

// Encapsulates previous auth/bootstrap logic from App.tsx
export function useAuthBootstrap(): AuthBootstrapState {
  const { setTelegramUser, loadUser } = useUserStore();
  const { user: telegramUser, status: authStatus } = useTelegramAuth();
  const [initialized, setInitialized] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (shouldUseGuestMode()) {
      setInitialized(true);
      setShowLoading(false);
      return;
    }
    if (telegramUser && authStatus === 'authenticated') {
      setTelegramUser(telegramUser as ParsedTelegramUser);
      setInitialized(true);
      setShowLoading(false);
    } else if (authStatus === 'error' || authStatus === 'loading') {
      setShowLoading(true);
    } else if (authStatus === 'idle') {
      const timeoutId = setTimeout(() => {
        if (!initialized) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('Auth timeout - proceeding without Telegram auth');
          }
          setInitialized(true);
          setShowLoading(false);
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
