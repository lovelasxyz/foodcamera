import { useEffect, useState } from 'react';
import { shouldUseGuestMode, getGuestModeReason } from '@/utils/environment';
import { useUserStore } from '@/store/userStore';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { apiService } from '@/services/apiService';
import { isApiEnabled } from '@/config/api.config';
import { telegramAuth } from '@/services/telegramAuth';

interface UseAppBootstrapResult {
  loading: boolean;
  ready: boolean;
}

export function useAppBootstrap(): UseAppBootstrapResult {
  const { setTelegramUser, loadUser, setToken } = useUserStore();
  const { user: telegramUser, status: authStatus } = useTelegramAuth();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready) return;

    // Guest shortcut
    if (shouldUseGuestMode()) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[bootstrap] Guest mode enabled:', getGuestModeReason());
      }
      (async () => {
        try { await loadUser(); } catch (e) { if (process.env.NODE_ENV !== 'production') console.debug('[bootstrap] loadUser(guest) failed', e); }
        setReady(true);
        setLoading(false);
      })();
      return;
    }

    if (authStatus === 'idle' || authStatus === 'loading') {
      setLoading(true);
      return;
    }

    if (authStatus === 'error') {
      // fallback as guest
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[bootstrap] Telegram auth error -> fallback guest');
      }
      (async () => {
        try { await loadUser(); } catch (e) { if (process.env.NODE_ENV !== 'production') console.debug('[bootstrap] loadUser(fallback) failed', e); }
        setReady(true);
        setLoading(false);
      })();
      return;
    }

    if (authStatus === 'authenticated' && telegramUser) {
      (async () => {
        setLoading(true);
        setTelegramUser(telegramUser);
        if (isApiEnabled()) {
          try {
            const token = await apiService.authWithTelegram(telegramAuth.getInitData());
            setToken(token);
          } catch (e) { if (process.env.NODE_ENV !== 'production') console.debug('[bootstrap] authWithTelegram failed', e); }
        }
        try { await loadUser(); } catch (e) { if (process.env.NODE_ENV !== 'production') console.debug('[bootstrap] loadUser(authenticated) failed', e); }
        setReady(true);
        setLoading(false);
      })();
    }
  }, [authStatus, telegramUser, loadUser, setTelegramUser, ready, setToken]);

  return { loading, ready };
}

export default useAppBootstrap;