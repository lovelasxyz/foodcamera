import React from 'react';
import { Case } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useCase } from '@/hooks/useCase';
import { ASSETS } from '@/constants/assets';
import { useDominantColor } from '@/hooks/useDominantColor';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';

import styles from './CaseCard.module.css';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';

interface CaseCardProps {
  caseData: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData }) => {
  const { t } = useI18n();
  const { openCase } = useGameStore();
  const { isFreeCase } = useCase();
  const { colorHex, rgba } = useDominantColor(caseData.image);
  const isOnline = useOnlineStatus();

  const handleOpenCase = () => {
    if (!isOnline) return;
    openCase(caseData, false);
  };

  const isFree = isFreeCase(caseData);
  const backgroundStyle = colorHex
    ? {
        background: `radial-gradient(61.63% 100.04% at 43.18% 123.86%, ${rgba(0.8)} 0%, ${rgba(0)} 100%), linear-gradient(rgba(20, 20, 21, 0) 0%, rgb(20, 20, 21) 100%)`
      }
    : {
        background: 'linear-gradient(rgba(20, 20, 21, 0) 0%, rgb(20, 20, 21) 100%)'
      };

  // Для Free Case используем специальную структуру
  if (isFree) {
    return (
      <div className={`${styles.caseCard} ${styles.freeCaseCard} ${!isOnline ? styles.disabled : ''}`} onClick={handleOpenCase}>
        <div className={styles.freeCaseImageContainer}>
          <img className={styles.freeCaseTextSvg} src={ASSETS.IMAGES.FREE_CASE_LABEL} alt={t('messages.freeCase')} />
          <ProgressiveImg className={styles.freeCaseImage} src={caseData.image} cacheKey={String(caseData.id)} alt={t('messages.freeCase')} />
        </div>
        <div className={styles.freeCaseFooter}>
          <div className={styles.freeCaseLabel}>{t('messages.freeCase')}</div>
        </div>
      </div>
    );
  }

  // Обычные кейсы
  return (
    <div className={`${styles.caseCard} ${!isOnline ? styles.disabled : ''}`} onClick={handleOpenCase}>
      <div 
        className={`${styles.caseImageContainer} ${caseData.blackBackdrop ? styles.blackBackdrop : ''}`}
        style={backgroundStyle}
      >
        {/* NEW Badge для новых кейсов */}
        {caseData.isNew && (
          <div className={styles.caseNewBadge}>
            <div className={styles.caseNewLabel}>🔥 HOT</div>
          </div>
        )}
        <ProgressiveImg className={styles.caseImage} src={caseData.image} cacheKey={String(caseData.id)} alt="Case Image" />
      </div>
      <div className={styles.caseFooter}>
        <div className={styles.caseName}>{caseData.name}</div>
      </div>
    </div>
  );
}; 