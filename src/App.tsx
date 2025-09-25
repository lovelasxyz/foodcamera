import React, { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import AppRouter from '@/router/AppRouter';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import './App.css';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import AppInitializer from '@/application/AppInitializer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { usePageScrollRestore } from '@/hooks/usePageScrollRestore';
import { initErrorTracking, registerGlobalErrorHandlers } from '@/services/errorTracking';
import { shouldUseGuestMode } from '@/utils/environment';

const AppContentInner: React.FC = () => {
  useUIStore();
  const { closeCase } = useGameStore();
  const { isExpanded, isAvailable } = useTelegramWebApp();
  useOnlineStatus();
  const { showLoading } = useAuthBootstrap();
  usePageScrollRestore();

  // Close case when switching between main sections
  useEffect(() => {
    // Case closing now tied to location inside router via global store subscription in future; keep simple for now
    const pathsToClose = new Set(['/', '/profile']);
    const path = window.location.pathname;
    if (pathsToClose.has(path)) {
      try { closeCase(); } catch { /* ignore */ }
    }
  }, [closeCase]);

  // Auth / bootstrap logic (old behavior)
  // App-level initializer start/stop & error tracking init
  useEffect(() => {
    const initializer = new AppInitializer();
    initializer.start();
    try {
      initErrorTracking({ dsn: (import.meta as any)?.env?.VITE_ERROR_TRACKING_DSN, environment: (import.meta as any)?.env?.MODE });
      registerGlobalErrorHandlers();
    } catch { /* ignore */ }
    return () => { try { initializer.stop(); } catch { /* ignore */ } };
  }, []);

  if (showLoading) {
    return (
      <LoadingScreen
        mode="telegram-auth"
        onRetry={!shouldUseGuestMode() ? () => {
          // Force re-render of loading flow by hard reload logic could be inserted
          window.location.reload();
        } : undefined}
      />
    );
  }

  return (
    <div className={`app-container ${isAvailable ? 'tg-viewport' : ''} ${isExpanded ? 'tg-expanded' : ''}`}>
      <AppRouter />
      <BottomNavigation />
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContentInner />
  </ErrorBoundary>
);

export default App;