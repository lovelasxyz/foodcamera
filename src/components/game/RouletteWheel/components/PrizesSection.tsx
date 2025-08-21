import React from 'react';
import { Prize } from '@/types/game';
import { MESSAGES } from '@/utils/constants';
import { ASSETS } from '@/constants/assets';
import styles from '../RouletteWheel.module.css';

interface PrizesSectionProps {
  items: Prize[];
  maxItems?: number;
}

export const PrizesSection: React.FC<PrizesSectionProps> = ({ 
  items, 
  maxItems = 12 
}) => {
  const displayItems = items.slice(0, maxItems);

  return (
    <div className={styles.prizesSection}>
      <div className={styles.prizesTitle}>{MESSAGES.POSSIBLE_PRIZES}</div>
      <div className={styles.prizesGrid}>
        {displayItems.map((item) => (
          <div key={item.id} className={styles.prizeItem}>
            <img className={styles.prizeImage} src={item.image} alt="Prize" />
            <div className={`${styles.hint} ${styles.prizeHint}`}>
              <div className={styles.coinWrapper}>
                <div className={`${styles.coin} ${styles.small}`}>
                  <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                </div>
              </div>
              <div className={styles.price}>{item.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 