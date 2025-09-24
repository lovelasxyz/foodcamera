import React, { useRef } from 'react';
import { animated } from 'react-spring';
import { Prize } from '@/types/game';
import { ASSETS } from '@/constants/assets';
import styles from '../RouletteWheel.module.css';

interface RouletteViewportProps {
  rouletteItems: Array<Prize & { uniqueId: string; originalIndex: number }>;
  animationStyle: any;
}

export const RouletteViewport: React.FC<RouletteViewportProps> = ({
  rouletteItems,
  animationStyle
}) => {
  const rouletteRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.rouletteViewport}>
      <animated.div 
        className={styles.rouletteItems} 
        style={animationStyle}
        ref={rouletteRef}
      >
        {rouletteItems.map((item) => (
          <div key={item.uniqueId} className={styles.rouletteItem} data-rarity={item.rarity || 'common'}>
            <img 
              src={item.image} 
              alt={item.name} 
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            />
            <div className={styles.prizeHint}>
              <img 
                src={ASSETS.IMAGES.TON} 
                alt="TON" 
                className={styles.coinIcon}
              />
              <span>{item.price}</span>
            </div>
          </div>
        ))}
      </animated.div>
      <div className={styles.shadowRight} />
    </div>
  );
}; 