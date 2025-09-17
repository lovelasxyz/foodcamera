import React from 'react';
import styles from '../RouletteWheel.module.css';
import { ASSETS } from '@/constants/assets';

interface SpinControlsProps {
  isSpinning: boolean;
  hasEnoughFunds: boolean;
  price: number;
  onSpin: () => void;
  onSkip: () => void;
  onDeposit: () => void;
  labelSpin: string;
  labelDeposit: string;
}

export const SpinControls: React.FC<SpinControlsProps> = ({
  isSpinning,
  hasEnoughFunds,
  price,
  onSpin,
  onSkip,
  onDeposit,
  labelSpin,
  labelDeposit
}) => {
  return (
    <div className={styles.actionButtons}>
      {hasEnoughFunds ? (
        <button 
          className={styles.keepButton}
          onClick={isSpinning ? onSkip : onSpin}
          disabled={false}
        >
          <div className={styles.buttonLabel}>
            {labelSpin}
          </div>
          <div className={styles.priceTag}>
            <div className={styles.priceValue}>{price.toFixed(2)}</div>
            <div className={styles.coinSmall}>
              <div className={styles.coin}>
                <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
              </div>
            </div>
          </div>
        </button>
      ) : (
        <>
          <div className={styles.notFunds}>
            <svg
              className={styles.infoIcon}
              width="23"
              height="23"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#FFFFFF"/>
              <rect x="11" y="10" width="2" height="6" rx="1" fill="#0F1115"/>
              <circle cx="12" cy="7.25" r="1.25" fill="#0F1115"/>
            </svg>
            <span>Not enough funds</span>
          </div>
          <button 
            className={`${styles.spinButton} ${styles.centered}`}
            onClick={onDeposit}
            disabled={isSpinning}
          >
            <div className={styles.buttonLabel}>{labelDeposit}</div>
          </button>
        </>
      )}
    </div>
  );
};



