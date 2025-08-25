import React from 'react';
import { ASSETS } from '@/constants/assets';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { shouldUseGuestMode } from '@/utils/environment';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  // Режим работы
  mode?: 'simple' | 'telegram-auth';
  
  // Для простого режима
  status?: string;
  showLogo?: boolean;
  
  // Для режима авторизации
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  mode = 'simple',
  status = 'Loading...',
  showLogo = true,
  onRetry 
}) => {
  const { status: authStatus, error, authenticate } = useTelegramAuth();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      authenticate();
    }
  };

  const getLoadingStatus = () => {
    if (shouldUseGuestMode()) {
      return 'Loading Gift Cases...';
    }
    
    switch (authStatus) {
      case 'loading':
        return 'Connecting to Telegram...';
      case 'authenticated':
        return 'Authentication successful';
      case 'error':
        return error || 'Authentication failed';
      case 'idle':
        return 'Waiting for Telegram...';
      default:
        return 'Initializing...';
    }
  };

  // Простой режим (бывший AppLoader)
  if (mode === 'simple') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.content}>
          {showLogo && (
            <div className={styles.logoContainer}>
              <div className={styles.logo}>
                <div className={styles.logoShape}>
                  <div className={styles.logoInner}>V</div>
                </div>
              </div>
              <h1 className={styles.appName}>Gift Cases</h1>
              <p className={styles.copyright}>Copyright © 2025</p>
            </div>
          )}
          
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.status}>{shouldUseGuestMode() ? 'Loading Gift Cases...' : status}</p>
          </div>
        </div>
      </div>
    );
  }

  // Режим авторизации Telegram (оригинальный LoadingPage)
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderContent}>
        <header className={styles.loaderHeader}>
          <div className={styles.logoContainer}>
            <img 
              src={ASSETS.IMAGES.LOADING_LOGO} 
              alt="Gift Cases Logo" 
              className={styles.floatingLogo}
            />
          </div>
          <h1 className={styles.loaderTitle}>RICK CASES</h1>
          <p className={styles.loaderCopyright}>Copyright © 2025</p>
        </header>
      </div>

      {!shouldUseGuestMode() && authStatus === 'error' && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Authentication Error</h2>
          <p className={styles.errorMessage}>
            {error || 'No Telegram initialization data available'}
          </p>
          <button className={styles.retryButton} onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}

      {(!shouldUseGuestMode() && authStatus === 'error') ? null : (
        <div className={styles.loaderStatus}>
          <div className={styles.spinner}></div>
          <p className={styles.statusText}>{getLoadingStatus()}</p>
        </div>
      )}

      <div className={styles.loaderSocialHandle}>@casebot</div>
    </div>
  );
}; 