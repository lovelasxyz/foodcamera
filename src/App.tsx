import React from 'react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import AppRouter from '@/router/AppRouter';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import './App.css';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SessionExpiredBanner from '@/components/system/SessionExpiredBanner';
import ErrorToast from '@/components/system/ErrorToast';
import useAppBootstrap from '@/hooks/useAppBootstrap';

const AppContentInner: React.FC = () => {
  useOnlineStatus();
  const { isExpanded, isAvailable } = useTelegramWebApp();
  const { loading, ready } = useAppBootstrap();

  if (loading && !ready) {
    return <LoadingScreen mode="telegram-auth" />;
  }


  // Routes are handled by React Router via `AppRouter`

  return (
    <div className={`app-container ${isAvailable ? 'tg-viewport' : ''} ${isExpanded ? 'tg-expanded' : ''}`}>
      <SessionExpiredBanner />
      <AppRouter />
      <ErrorToast />
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