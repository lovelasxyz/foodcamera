import React from 'react';
import { useI18n } from '@/i18n';
import styles from '../../HomePage.module.css';

interface CasesStateViewProps {
  isOnline: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onHideError: () => void;
}

export const CasesStateView: React.FC<CasesStateViewProps> = ({
  isOnline,
  isLoading,
  hasError,
  onRetry,
  onHideError
}) => {
  const { t } = useI18n();

  if (!isOnline && isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.loadingText}>{t('home.loadingCases')}</div>
      </div>
    );
  }

  if (!isOnline && hasError) {
    return (
      <>
        <div className={styles.errorMessageContainer}>
          <div className={styles.errorMessageContent}>{t('common.offlineFeatures')}</div>
          <button className={styles.errorClose} onClick={onHideError}>×</button>
        </div>
        <div className={styles.errorState}>
          <div className={styles.errorMessage}>{t('common.failedToLoad')}</div>
          <button className={styles.retryButton} onClick={onRetry}>
            <div className={styles.buttonLabel}>{t('common.tryAgain')}</div>
          </button>
        </div>
      </>
    );
  }

  return null;
};


