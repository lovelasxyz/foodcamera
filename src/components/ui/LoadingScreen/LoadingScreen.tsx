import React, { useMemo } from 'react';
import { ASSETS } from '@/constants/assets';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { shouldUseGuestMode } from '@/utils/environment';
import styles from './LoadingScreen.module.css';
import { useI18n } from '@/i18n';
import { TELEGRAM_CONFIG } from '@/constants/telegram';
import { TelegramLoginButton } from './TelegramLoginButton';

interface LoadingScreenProps {
  // Режим работы
  mode?: 'simple' | 'telegram-auth';
  
  // Для простого режима
  status?: string;
  showLogo?: boolean;
  
  // Для режима авторизации
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onRetry }) => {
  const { t, lang } = useI18n();
  const {
    status: authStatus,
    error,
    authenticate,
    mode: authMode,
    isWidgetAvailable,
    handleLoginWidgetAuth,
  } = useTelegramAuth();
  const guestMode = shouldUseGuestMode();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (authMode === 'webapp') {
      authenticate();
    }
  };

  const getLoadingStatus = () => {
    if (guestMode) {
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

  const botHandle = useMemo(() => {
    const username = TELEGRAM_CONFIG.botUsername?.trim();
    if (!username) {
      return '@casesbot';
    }
    return username.startsWith('@') ? username : `@${username}`;
  }, []);

  const loginWidgetLang = useMemo(() => {
    return lang.startsWith('ru') ? 'ru' : 'en';
  }, [lang]);

  const showWidgetCard = !guestMode && authMode === 'widget' && isWidgetAvailable && (authStatus === 'idle' || authStatus === 'error');
  const shouldShowSpinner = useMemo(() => {
    if (guestMode) {
      return true;
    }
    if (authMode === 'widget') {
      return authStatus === 'loading' || authStatus === 'authenticated';
    }
    return authStatus !== 'error';
  }, [guestMode, authMode, authStatus]);


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
          <h1 className={styles.loaderTitle}>
            {t(authMode === 'widget' ? 'loading.appName' : 'loading.casesByPortal')}
          </h1>
          <p className={styles.loaderCopyright}>{t('loading.copyright')}</p>
        </header>
      </div>

      {showWidgetCard && (
        <div className={styles.loginCard}>
          <div className={styles.loginIcon}>⚡</div>
          <h2 className={styles.loginTitle}>{t('loading.signInTitle')}</h2>
          <p className={styles.loginSubtitle}>{t('loading.signInSubtitle')}</p>

          {TELEGRAM_CONFIG.botUsername ? (
            <TelegramLoginButton
              botUsername={TELEGRAM_CONFIG.botUsername}
              lang={loginWidgetLang}
              onAuth={handleLoginWidgetAuth}
            />
          ) : (
            <p className={styles.loginUnavailable}>{t('loading.loginUnavailable')}</p>
          )}

          {authStatus === 'error' && error && (
            <div className={styles.loginError}>{error}</div>
          )}
        </div>
      )}

      {!guestMode && authMode !== 'widget' && authStatus === 'error' && (
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

      {shouldShowSpinner && (
        <div className={styles.loaderStatus}>
          <div className={styles.spinner}></div>
          <p className={styles.statusText}>{getLoadingStatus()}</p>
        </div>
      )}

      <div className={styles.loaderSocialHandle}>{botHandle}</div>
    </div>
  );
}; 