import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import styles from './CaseCard.module.css';

export const CaseCardSkeleton: React.FC = () => {
  return (
    <div className={styles.caseCard}>
      <div className={styles.caseImageContainer}>
        <Skeleton width="100%" height={176} borderRadius={16} />
      </div>
      <div className={styles.caseFooter}>
        <Skeleton width={60} height={18} />
        <div className={styles.coin}>
          <Skeleton width={20} height={20} borderRadius={999} />
        </div>
      </div>
    </div>
  );
};


