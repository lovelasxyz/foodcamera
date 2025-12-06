import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { shouldUseGuestMode } from '@/utils/environment';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { ParsedTelegramUser } from '@/types/telegram';
import { apiService } from '@/services/apiService';
import { isApiEnabled } from '@/config/api.config';
import { DevLogger } from '@/services/devtools/loggerService';

interface AuthBootstrapState {
  initializing: boolean;
  showLoading: boolean;
  initialized: boolean;
}

// Минимальное время показа загрузочного экрана (в мс)
const MIN_LOADING_TIME = 1500;

import { userStorage } from '@/store/userStorage';

// Encapsulates previous auth/bootstrap logic from App.tsx
export function useAuthBootstrap(): AuthBootstrapState {
  const { setTelegramUser, loadUser, setError: setUserError, setLoading: setUserLoading } = useUserStore();
  const {
    user: telegramUser,
    status: authStatus,
    error: authError,
    initData,
    mode: authMode,
  } = useTelegramAuth();
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
      if (isApiEnabled()) {
        if (!backendAuthInFlight.current) {
          backendAuthInFlight.current = true;
          void (async () => {
            try {
              let { token } = useUserStore.getState();
              
              // Double check storage if store is empty (failsafe)
              if (!token) {
                const stored = userStorage.getToken();
                if (stored) {
                  DevLogger.logInfo('[AuthBootstrap] Restored token from storage fallback:', { token: stored });
                  useUserStore.getState().setToken(stored);
                  token = stored;
                }
              }

              DevLogger.logInfo('[AuthBootstrap] Checking token:', { token });
              if (!token) {
                DevLogger.logInfo('[AuthBootstrap] No token found, authenticating as guest...', {});
                const newToken = await apiService.authGuest();
                DevLogger.logInfo('[AuthBootstrap] Guest auth successful, token:', { token: newToken });
                useUserStore.getState().setToken(newToken);
                // Explicitly force save to storage to be absolutely sure
                userStorage.setToken(newToken);
              } else {
                DevLogger.logInfo('[AuthBootstrap] Token found, skipping guest auth.', {});
              }
              await loadUser();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('Guest auth failed', e);
            } finally {
              hideLoadingWithDelay();
            }
          })();
        }
      } else {
        hideLoadingWithDelay();
      }
      return;
    }
    if (telegramUser && authStatus === 'authenticated' && initData) {
      setTelegramUser(telegramUser as ParsedTelegramUser);

      if (!backendAuthInFlight.current) {
        backendAuthInFlight.current = true;
        setShowLoading(true);
        setUserLoading(true);

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
    } else if (authStatus === 'error') {
      setShowLoading(true);
      if (authError) {
        setUserError(authError);
      }
      setUserLoading(false);
      if (authMode !== 'widget') {
        hideLoadingWithDelay();
      }
    } else if (authStatus === 'idle' && authMode !== 'widget' && authMode !== 'webapp') {
      // If Telegram is NOT available (authMode === 'none') and API is enabled, try Guest Auth
      // Important: Don't fallback to guest if authMode is 'webapp' - wait for Telegram auth
      if (!backendAuthInFlight.current && isApiEnabled()) {
        backendAuthInFlight.current = true;
        setShowLoading(true);
        
        void (async () => {
          try {
            // Check if we already have a token (persisted in localStorage)
            const { token } = useUserStore.getState();
            
            if (token) {
              try {
                // Try to load user with existing token
                await loadUser();
                // If successful, we are done
                return;
              } catch (e) {
                // Token invalid or expired, proceed to guest auth
                // eslint-disable-next-line no-console
                console.warn('Existing token failed, falling back to guest auth', e);
              }
            }

            // No token or invalid token -> Create new guest session
            await apiService.authGuest();
            await loadUser();
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Guest auth failed', err);
            // Fallback to hiding loading, maybe user can retry or use app in limited state
          } finally {
            hideLoadingWithDelay();
          }
        })();
      }
    }
  }, [telegramUser, authStatus, authError, initData, authMode, setTelegramUser, loadUser, setUserError, setUserLoading, initialized, guestMode]);

  useEffect(() => {
    // In guest mode, we handle loading in the main effect above
    // if (guestMode) {
    //   void loadUser();
    // }
  }, [guestMode, loadUser]);

  return { initializing: !initialized, showLoading, initialized };
}
