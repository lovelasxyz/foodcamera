import React from 'react';
import { MESSAGES } from '@/utils/constants';
import { THEME_COLORS } from '@/styles/theme';
import styles from '../RouletteWheel.module.css';
import { ASSETS } from '@/constants/assets';

interface ActionButtonsProps {
  isSpinning: boolean;
  hasEnoughFunds: boolean;
  spinCost: number;
  onSpin: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isSpinning,
  hasEnoughFunds,
  spinCost,
  onSpin,
}) => {
  return (
    <>
      <div className={styles.actionButtons}>
        <button 
          className={styles.spinButton}
          onClick={onSpin}
          disabled={isSpinning || !hasEnoughFunds}
        >
                <div className={styles.buttonLabel}> {isSpinning ? 'Spinning...' : `Spin`} </div>
              
              <div className={styles.priceTag}>
               <div className={styles.priceValue}>{spinCost.toFixed(2)}</div>
               <div className={styles.coinSmall}>
                 <div className={styles.coin}>
                   <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                 </div>
               </div>
               </div>
        </button>
      </div>

      {!hasEnoughFunds && (
        <div style={{ 
          textAlign: 'center', 
          color: THEME_COLORS.textSecondary, 
          fontSize: '14px',
          marginTop: '12px'
        }}>
          {MESSAGES.INSUFFICIENT_BALANCE} {spinCost.toFixed(2)} TON
        </div>
      )}
    </>
  );
}; 