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
  const [isKeeping, setIsKeeping] = React.useState(false);

  const handleKeep = () => {
    if (isKeeping) return;
    setIsKeeping(true);
    // Let the animation run, then trigger onKeep
    setTimeout(() => {
      onKeep();
      setIsKeeping(false);
    }, 1500);
  };
  return (
    <div className={styles.resultContainer}>
      <div className={styles.winContainer}>
        <div className={styles.prizeShowcase}>
          <div className={styles.lightsContainer}>
            <img className={styles.lights} src={ASSETS.EFFECTS.LIGHTS} alt="Background lights" />
            <img className={`${styles.stars} ${styles.starsAnimation}`} src={ASSETS.EFFECTS.STARS} alt="Stars" />
          </div>
          {image && (
            <ProgressiveImg 
              src={image}
              alt={name || 'Prize Item'}
              className={`${styles.winPrizeImage} ${isKeeping ? styles.keepItAnimation : ''}`}
              cacheKey={String(price ?? '')}
            />
          )}
          {typeof price === 'number' && (
            <div className={`${styles.hint} ${styles.prizeHint}`}>
              <div className={styles.coinWrapper}>
                <div className={`${styles.coin} ${styles.small}`}>
                  <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                </div>
              </div>
              <div className={styles.price}>{price.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.resultActions}>
        <button onClick={handleKeep} className={`${styles.spinButton} ${styles.centered}`} disabled={isKeeping}>
          <div className={styles.buttonLabel}>{keepLabel}</div>
        </button>
        {showSell && (
          <button 
            className={styles.quickSellButton}
            onClick={onSell}
            disabled={isSpinning || isKeeping}
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



