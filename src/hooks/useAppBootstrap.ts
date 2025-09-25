import { useEffect, useState } from 'react';
import { shouldUseGuestMode } from '@/utils/environment';
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
      (async () => {
        try { await loadUser(); } catch { /* ignore */ }
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
      (async () => {
        try { await loadUser(); } catch { /* ignore */ }
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
          } catch { /* silent */ }
        }
        try { await loadUser(); } catch { /* ignore */ }
        setReady(true);
        setLoading(false);
      })();
    }
  }, [authStatus, telegramUser, loadUser, setTelegramUser, ready, setToken]);

  return { loading, ready };
}

export default useAppBootstrap;