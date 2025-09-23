import React from 'react';
import styles from '../RouletteWheel.module.css';
import { ASSETS } from '@/constants/assets';
import { Prize } from '@/types/game';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';

interface PossiblePrizesProps {
  title: string;
  prizes: Prize[];
  onPreview: (item: Prize) => void;
}

export const PossiblePrizes: React.FC<PossiblePrizesProps> = ({ title, prizes, onPreview }) => {
  return (
    <div className={styles.prizesSection}>
      <div className={styles.prizesTitle}>{title}</div>
      <div className={styles.prizesGrid}>
        {prizes.map((item) => (
          <div key={item.id} className={styles.prizeGridItem} data-rarity={item.rarity} onClick={() => onPreview(item)} style={{ cursor: 'pointer' }}>
            <ProgressiveImg src={item.image} alt={item.name} cacheKey={String(item.id)} style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
            <div className={styles.prizeHint}>
              <img 
                src={ASSETS.IMAGES.TON} 
                alt="TON" 
                className={styles.coinIcon}
              />
              <div className={styles.price}> <span>{item.price}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
