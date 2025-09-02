import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
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
import { ConnectivityGuard } from '@/services/ConnectivityGuard';

const AppContent: React.FC = () => {
  const { activePage } = useUIStore();
  const { setTelegramUser } = useUserStore();
  const { isExpanded, isAvailable } = useTelegramWebApp();
  const { user: telegramUser, status: authStatus, isWebAppAvailable } = useTelegramAuth();
  useOnlineStatus();
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [showLoadingPage, setShowLoadingPage] = useState(true);

  // Обрабатываем авторизацию пользователя
  useEffect(() => {
    if (shouldUseGuestMode()) {
      // В guest режиме показываем быстрый загрузочный экран
      console.log('Running in guest mode (development or no Telegram WebApp)');
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
          console.log('Auth timeout - proceeding without Telegram auth');
          setInitializationComplete(true);
          setShowLoadingPage(false);
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [telegramUser, authStatus, setTelegramUser, isWebAppAvailable, initializationComplete]);

  useEffect(() => { ConnectivityGuard.start(); }, []);

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
    <Router>
      <AppContent />
    </Router>
  );
};

export default App; 