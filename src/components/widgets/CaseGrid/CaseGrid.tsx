import React from 'react';
import styles from '@/pages/HomePage/HomePage.module.css';
import { Case } from '@/types/game';
import { CaseCard } from '@/components/game/CaseCard';
import { CaseCardSkeleton } from '@/components/game/CaseCard/CaseCardSkeleton';
import { useI18n } from '@/i18n';

interface CaseGridProps {
  cases: Case[];
  loading: boolean;
  showErrorBanner: boolean;
  showErrorState: boolean;
  onHideErrorBanner: () => void;
  onRetry?: () => void;
}

export const CaseGrid: React.FC<CaseGridProps> = ({ cases, loading, showErrorBanner, showErrorState, onHideErrorBanner, onRetry }) => {
  const { t } = useI18n();

  if (loading && cases.length === 0) {
    return (
      <div className={styles.casesGrid}>
        {Array.from({ length: 8 }).map((_, i) => <CaseCardSkeleton key={`case-skeleton-${i}`} />)}
      </div>
    );
  }

  return (
    <>
      {showErrorBanner && (
        <div className={styles.errorMessageContainer}>
          <div className={styles.errorMessageContent}>{t('common.offlineFeatures')}</div>
          <button className={styles.errorClose} onClick={onHideErrorBanner}>×</button>
        </div>
      )}
      {showErrorState && (
        <div className={styles.errorState}>
          <div className={styles.errorMessage}>{t('common.failedToLoad')}</div>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              <div className={styles.buttonLabel}>{t('common.tryAgain')}</div>
            </button>
          )}
        </div>
      )}
      <div className={styles.casesGrid}>
        {cases.map((c) => <CaseCard key={c.id} caseData={c} />)}
      </div>
    </>
  );
};


