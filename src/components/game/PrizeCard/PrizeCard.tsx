import React from 'react';
import { Prize } from '@/types/game';
import { clsx } from 'clsx';
import styles from './PrizeCard.module.css';

interface PrizeCardProps {
  prize: Prize;
  className?: string;
}

export const PrizeCard: React.FC<PrizeCardProps> = ({ prize, className }) => {
  return (
    <div className={clsx(styles.prizeCard, styles[prize.rarity || 'common'], className)}>
      <div className={styles.imageContainer}>
        <img 
          src={prize.image} 
          alt={prize.name} 
          className={clsx(styles.prizeImage)}

        />
      </div>
      <div className={styles.prizeInfo}>
        <h4 className={styles.prizeName}>{prize.name}</h4>
        <div className={styles.prizePrice}>
          {prize.price.toFixed(2)} <span className={styles.token}>T</span>
        </div>
      </div>
    </div>
  );
}; 