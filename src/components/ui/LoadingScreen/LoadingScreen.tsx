import React from 'react';
import { ASSETS } from '@/constants/assets';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { shouldUseGuestMode } from '@/utils/environment';
import styles from './LoadingScreen.module.css';
import { useI18n } from '@/i18n';

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
  const { t } = useI18n();
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
      return t('loading.connecting');
    }
    
    switch (authStatus) {
      case 'loading':
        return t('loading.connectingTelegram');
      case 'authenticated':
        return t('loading.authSuccess');
      case 'error':
        return error || t('loading.authFailed');
      case 'idle':
        return t('loading.waitingTelegram');
      default:
        return t('loading.initializing');
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
              <h1 className={styles.appName}>{t('loading.appName')}</h1>
              <p className={styles.copyright}>{t('loading.copyright')}</p>
            </div>
          )}
          
          <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.status}>{shouldUseGuestMode() ? t('loading.connecting') : status}</p>
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
          <h1 className={styles.loaderTitle}>{t('loading.casesByPortal')}</h1>
          <p className={styles.loaderCopyright}>{t('loading.copyright')}</p>
        </header>
      </div>

      {!shouldUseGuestMode() && authStatus === 'error' && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>{t('loading.authErrorTitle')}</h2>
          <p className={styles.errorMessage}>
            {error || t('loading.noTelegramData')}
          </p>
          <button className={styles.retryButton} onClick={handleRetry}>
            {t('common.tryAgain')}
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