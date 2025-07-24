import React from 'react';
import { Multiplier } from '@/types/game';
import styles from '../RouletteWheel.module.css';

interface MultiplierTabsProps {
  multipliers: Multiplier[];
  selectedMultiplier: number;
  isSpinning: boolean;
  onMultiplierChange: (multiplier: number) => void;
}

export const MultiplierTabs: React.FC<MultiplierTabsProps> = ({
  multipliers,
  selectedMultiplier,
  isSpinning,
  onMultiplierChange
}) => {
  return (
    <div className={styles.multiplierTabs}>
      {multipliers.map((multiplier) => (
        <button
          key={multiplier.value}
          className={`${styles.multiplierTab} ${
            selectedMultiplier === multiplier.value ? styles.active : ''
          } ${isSpinning ? styles.disabled : ''}`}
          onClick={() => onMultiplierChange(multiplier.value)}
          disabled={isSpinning}
        >
          {multiplier.label}
        </button>
      ))}
    </div>
  );
}; 