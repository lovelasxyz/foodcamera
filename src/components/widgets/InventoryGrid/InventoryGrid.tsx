import React from 'react';
import styles from '@/pages/ProfilePage/ProfilePage.module.css';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

interface InventoryGridProps {
  loading: boolean;
  empty: boolean;
  renderContent: () => React.ReactNode;
  renderEmpty: () => React.ReactNode;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({ loading, empty, renderContent, renderEmpty }) => {
  const hasShownInitialSkeletonRef = React.useRef<boolean>(false);

  if (loading) {
    if (!hasShownInitialSkeletonRef.current) {
      hasShownInitialSkeletonRef.current = true;
      return (
        <div className={styles.inventoryGrid}>
          {Array.from({ length: 8 }).map((_, i) => <div key={`inv-sk-${i}`}><Skeleton width="100%" height={195} borderRadius={16} /></div>)}
        </div>
      );
    }
    return <>{renderContent()}</>;
  }

  if (empty) {
    return <>{renderEmpty()}</>;
  }

  return <>{renderContent()}</>;
};


