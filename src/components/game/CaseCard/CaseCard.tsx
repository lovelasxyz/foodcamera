import React from 'react';
import { Case } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useCase } from '@/hooks/useCase';
import { CaseService } from '@/services/CaseService';

import styles from './CaseCard.module.css';

interface CaseCardProps {
  caseData: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData }) => {
  const { openCase } = useGameStore();
  const { canAffordCase, isFreeCase } = useCase();

  const handleOpenCase = () => {
    if (!canAffordCase(caseData)) {
      return;
    }

    openCase(caseData, false);
  };

  const isFree = isFreeCase(caseData);
  const backgroundStyle = CaseService.getBackgroundStyle(caseData);

  // Для Free Case используем специальную структуру
  if (isFree) {
    return (
      <div className={`${styles.caseCard} ${styles.freeCaseCard}`} onClick={handleOpenCase}>
        <div className={styles.freeCaseImageContainer}>
          <img 
            className={styles.freeCaseTextSvg} 
            src="assets/images/free_case_label.svg" 
            alt="Free Case"
          />
          <img 
            className={styles.freeCaseImage} 
            src={caseData.image} 
            alt="Free Case Image"
          />
        </div>
        <div className={styles.freeCaseFooter}>
          <div className={styles.freeCaseLabel}>Free Case</div>
        </div>
      </div>
    );
  }

  // Обычные кейсы
  return (
    <div className={styles.caseCard} onClick={handleOpenCase}>
      <div 
        className={`${styles.caseImageContainer} ${caseData.blackBackdrop ? styles.blackBackdrop : ''}`}
        style={backgroundStyle}
      >
        {/* NEW Badge для новых кейсов */}
        {caseData.isNew && (
          <div className={styles.caseNewBadge}>
            <div className={styles.caseNewLabel}>NEW</div>
          </div>
        )}
        <img 
          className={styles.caseImage} 
          src={caseData.image} 
          alt="Case Image"
        />
      </div>
      <div className={styles.caseFooter}>
        <div className={styles.casePrice}>{caseData.price}</div>
        <div className={styles.coin}>
          <img 
            className={styles.coinImage} 
            src="/assets/images/ton.svg" 
            alt="Coin"
          />
        </div>
      </div>
    </div>
  );
}; 