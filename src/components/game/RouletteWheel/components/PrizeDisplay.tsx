import React from 'react';
import styles from '../RouletteWheel.module.css';
import { ASSETS } from '@/constants/assets';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';

interface PrizeDisplayProps {
  name?: string;
  price?: number;
  image?: string;
  keepLabel: string;
  sellLabel: string;
  isSpinning: boolean;
  onKeep: () => void;
  onSell: () => void;
  showSell?: boolean;
}

export const PrizeDisplay: React.FC<PrizeDisplayProps> = ({
  name,
  price,
  image,
  keepLabel,
  sellLabel,
  isSpinning,
  onKeep,
  onSell,
  showSell = true
}) => {
  return (
    <div className={styles.resultContainer}>
      <div style={{ 
        fontSize: '18px', 
        color: 'rgba(255, 255, 255, 0.7)', 
        marginBottom: '8px' 
      }}>
        {name}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#0075FF'
      }}>
        <img 
          src={ASSETS.IMAGES.TON} 
          alt="TON" 
          style={{ width: '24px', height: '24px' }}
        />
        <span>{price}</span>
      </div>
      <div className={styles.resultPrize}>
        {image && (
          <div style={{ 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            position: 'relative'
          }}>
            <ProgressiveImg 
              src={image} 
              alt={name || 'Prize'}
              style={{ 
                width: '120px', 
                height: '120px', 
                objectFit: 'contain',
              }}
              cacheKey={String(price ?? '')}
            />
          </div>
        )}
      </div>
      <div className={styles.resultActions}>
        <button onClick={onKeep} className={`${styles.spinButton} ${styles.centered}`}>
          <div className={styles.buttonLabel}>{keepLabel}</div>
        </button>
        {showSell && (
          <button 
            className={styles.quickSellButton}
            onClick={onSell}
            disabled={isSpinning}
          >
            <div className={styles.buttonLabel}>{sellLabel}</div>
            {typeof price === 'number' && (
              <div className={styles.priceTag}>
                <div className={styles.priceValue}>{price.toFixed(2)}</div>
                <div className={styles.coinSmall}>
                  <div className={styles.coin}>
                    <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                  </div>
                </div>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};



