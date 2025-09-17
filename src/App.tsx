import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { HomePage } from '@/pages/HomePage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { shouldUseGuestMode } from '@/utils/environment';
import './App.css';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import AppInitializer from '@/application/AppInitializer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const AppContentInner: React.FC = () => {
  const { activePage } = useUIStore();
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
    if (activePage === 'profile' || activePage === 'main') {
      try { closeCase(); } catch {}
    }
  }, [activePage, closeCase]);

  // Обрабатываем авторизацию пользователя
  useEffect(() => {
    if (shouldUseGuestMode()) {
      // В guest режиме показываем быстрый загрузочный экран
      setTimeout(() => {
        setInitializationComplete(true);
        setShowLoadingPage(false);
      }, 2000); // 2 секунды для показа загрузочного экрана
      return;
    }

    // Telegram WebApp режим
    if (telegramUser && authStatus === 'authenticated') {
      setTelegramUser(telegramUser);
      
      // Задержка для показа успешной авторизации
      setTimeout(() => {
        setInitializationComplete(true);
        setShowLoadingPage(false);
      }, 1500);
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
          if (process.env.NODE_ENV === 'development') console.log('Auth timeout - proceeding without Telegram auth');
          setInitializationComplete(true);
          setShowLoadingPage(false);
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [telegramUser, authStatus, setTelegramUser, isWebAppAvailable, initializationComplete]);

  useEffect(() => {
    const initializer = new AppInitializer();
    initializer.start();
    return () => {
      try { initializer.stop(); } catch {}
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
    const targetY = scrollPositionsRef.current[activePage] ?? 0;
    if (container) {
      container.scrollTo({ top: targetY, behavior: 'auto' });
    } else {
      window.scrollTo({ top: targetY, behavior: 'auto' });
    }
    previousPageRef.current = activePage;
  }, [activePage]);

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


  const renderPage = () => {
    switch (activePage) {
      case 'main':
        return <HomePage />;
      case 'profile':
        return <ProfilePage />;
      case 'weekly':
        return <div className="page-container"><h2>Weekly Page</h2><p>Coming soon...</p></div>;
      case 'jackpot':
        return <div className="page-container"><h2>JackPot Page</h2><p>Coming soon...</p></div>;
      case 'upgrade':
        return <div className="page-container"><h2>Upgrade Page</h2><p>Coming soon...</p></div>;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`app-container ${isAvailable ? 'tg-viewport' : ''} ${isExpanded ? 'tg-expanded' : ''}`}>
      {renderPage()}
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