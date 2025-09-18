import React from 'react';
import styles from './RouletteWheel.module.css';
import { useSpinAnimation } from './hooks/useSpinAnimation';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';

interface RouletteViewportProps {
  items: Array<{ uniqueId: string; image: string; name: string; price: number; rarity?: string } & Record<string, any>>;
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
            className={`${styles.rouletteItem} ${index === targetReplicaIndex ? styles.highlighted : ''}`}
            data-rarity={item.rarity || 'common'}
            data-index={index}
            data-original-index={item.originalIndex}
          >
            <ProgressiveImg 
              src={item.image}
              alt={item.name}
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
              cacheKey={String(item.id || item.originalIndex || index)}
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




