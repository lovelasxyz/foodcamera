import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import AppRouter from '@/router/AppRouter';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { shouldUseGuestMode } from '@/utils/environment';
import './App.css';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import AppInitializer from '@/application/AppInitializer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const AppContentInner: React.FC = () => {
  useUIStore();
  const location = useLocation();
  const routeKey = location.pathname || '/';
  const { closeCase } = useGameStore();
  const { setTelegramUser, loadUser } = useUserStore();
  const { isExpanded, isAvailable } = useTelegramWebApp();
  const { user: telegramUser, status: authStatus, isWebAppAvailable } = useTelegramAuth();
  useOnlineStatus();
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [showLoadingPage, setShowLoadingPage] = useState(true);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const previousPageRef = useRef<string | null>(null);

  // Close case when switching between main sections
  useEffect(() => {
    // Close case when navigating to main sections (home/profile)
    const key = routeKey;
    if (key === '/' || key === '/profile') {
      try { closeCase(); } catch { /* ignore close errors */ }
    }
  }, [closeCase, routeKey]);

  // Обрабатываем авторизацию пользователя
  useEffect(() => {
    if (shouldUseGuestMode()) {
      setInitializationComplete(true);
      setShowLoadingPage(false);
      return;
    }

    // Telegram WebApp режим
    if (telegramUser && authStatus === 'authenticated') {
      setTelegramUser(telegramUser);
      
      setInitializationComplete(true);
      setShowLoadingPage(false);
    } else if (authStatus === 'error') {
      // При ошибке авторизации показываем LoadingPage с ошибкой
      setShowLoadingPage(true);
    } else if (authStatus === 'loading') {
      // Показываем загрузочный экран во время авторизации
      setShowLoadingPage(true);
    } else if (authStatus === 'idle') {
      // Если статус idle более 3 секунд, показываем приложение
      const timeoutId = setTimeout(() => {
        if (!initializationComplete) {
          if (process.env.NODE_ENV !== 'production') {
            // debug: auth timeout, proceed without Telegram auth
            // eslint-disable-next-line no-console
            console.debug('Auth timeout - proceeding without Telegram auth');
          }
          setInitializationComplete(true);
          setShowLoadingPage(false);
        }
      }, 1200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [telegramUser, authStatus, setTelegramUser, isWebAppAvailable, initializationComplete]);

  useEffect(() => {
    const initializer = new AppInitializer();
    initializer.start();
    return () => {
      try { initializer.stop(); } catch { /* ignore */ }
    };
  }, []);

  // Initial user load in guest mode
  useEffect(() => {
    if (shouldUseGuestMode()) {
      loadUser();
    }
  }, [loadUser]);

  // Сохраняем и восстанавливаем позицию скролла отдельно для каждой страницы
  useLayoutEffect(() => {
    const container = document.querySelector('.app-container') as HTMLElement | null;
    // Сохранить позицию предыдущей страницы
    if (previousPageRef.current) {
      const prevKey = previousPageRef.current;
      const currentScroll = container ? container.scrollTop : window.scrollY;
      scrollPositionsRef.current[prevKey] = currentScroll;
    }
    // Восстановить позицию для текущей страницы
    const currentKey = routeKey;
    const targetY = scrollPositionsRef.current[currentKey] ?? 0;
    if (container) {
      container.scrollTo({ top: targetY, behavior: 'auto' });
    } else {
      window.scrollTo({ top: targetY, behavior: 'auto' });
    }
    previousPageRef.current = currentKey;
  }, [routeKey]);

  // Показываем LoadingPage если инициализация не завершена
  if (showLoadingPage) {
    return (
      <LoadingScreen 
        mode="telegram-auth"
        onRetry={!shouldUseGuestMode() ? () => {
          // Сбрасываем состояние для повторной попытки
          setShowLoadingPage(false);
          setTimeout(() => setShowLoadingPage(true), 100);
        } : undefined}
      />
    );
  }


  // Routes are handled by React Router via `AppRouter`

  return (
    <div className={`app-container ${isAvailable ? 'tg-viewport' : ''} ${isExpanded ? 'tg-expanded' : ''}`}>
  <AppRouter />
      <BottomNavigation />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContentInner />
    </ErrorBoundary>
  );
};

export default App; 