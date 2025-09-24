import React from 'react';
import styles from './RouletteWheel.module.css';
import { useSpinAnimation } from './hooks/useSpinAnimation';
import { RouletteItem } from '@/types/game';

interface RouletteViewportProps {
  items: RouletteItem[];
  isSpinning: boolean;
  instantPosition: boolean;
  position: number;
  targetReplicaIndex: number | null;
  onTransitionEnd: () => void;
  tonIcon: string;
  unionIcon: string;
}

export const RouletteViewport: React.FC<RouletteViewportProps> = ({
  items,
  isSpinning,
  instantPosition,
  position,
  targetReplicaIndex,
  onTransitionEnd,
  tonIcon,
  unionIcon
}) => {
  const animationStyle = useSpinAnimation(isSpinning, instantPosition, position);

  return (
    <div className={styles.rouletteViewport}>
      <div 
        className={styles.rouletteItems}
        onTransitionEnd={onTransitionEnd}
        style={animationStyle}
      >
        {items.map((item, index) => (
          <div
            key={item.uniqueId}
            className={`${styles.prizeItem} ${index === targetReplicaIndex ? styles.highlighted : ''}`}
            data-rarity={item.rarity || 'common'}
            data-index={index}
            data-original-index={item.originalIndex}
            style={{ width: '100px', height: '100px' }}
          >
            <img
              src={item.image}
              alt={item.name}
              className={styles.roulettePrizeImage}
              style={{ width: '75px', height: '75px', objectFit: 'contain' }}
            />
            <div className={styles.prizeHint}>
              <img src={tonIcon} alt="TON" className={styles.coinIcon} />
              <div className={styles.price}><span>{item.price}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.bg}></div>
      <div className={styles.pointersContainer}>
        <img src={unionIcon} className={styles.unionTop} alt="" />
        <img src={unionIcon} className={styles.unionBottom} alt="" />
      </div>
      <div className={styles.shadowRight} />
    </div>
  );
};




