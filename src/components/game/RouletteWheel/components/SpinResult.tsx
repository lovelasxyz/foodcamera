import React from 'react';
import { SpinResult, Prize } from '@/types/game';
import { THEME_COLORS } from '@/styles/theme';
import styles from '../RouletteWheel.module.css';

interface SpinResultDisplayProps {
  spinResult: SpinResult;
  caseName: string;
  onKeepPrize: () => void;
  onQuickSell: () => void;
}

export const SpinResultDisplay: React.FC<SpinResultDisplayProps> = ({
  spinResult,
  onKeepPrize
}) => {
  return (
    <div className={styles.resultContainer}>
      <div style={{ 
        fontSize: '18px', 
        color: THEME_COLORS.textSecondary, 
        marginBottom: '8px' 
      }}>
        {spinResult.prize.name}
      </div>

      <div className={styles.resultPrize}>
        <img 
          src={spinResult.prize.image}
          alt={spinResult.prize.name}
          style={{ 
            width: '120px', 
            height: '120px', 
            objectFit: 'contain',
          }}
        />
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
          src="/assets/images/ton.svg" 
          alt="TON" 
          style={{ width: '24px', height: '24px' }}
        />
        <span>{spinResult.prize.price}</span>
      </div>

      <div className={styles.resultActions}>
       
         <button onClick={onKeepPrize} className={`${styles.spinButton} ${styles.centered}`}><div className={styles.buttonLabel}>Keep it</div></button>
        
        
      </div>

      <div style={{ 
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px'
      }}>
        🎉 Congratulations! You won {spinResult.prize.name}
      </div>
    </div>
  );
};

// Дополнительный компонент для отображения списка возможных призов
interface PossiblePrizesProps {
  prizes: Prize[];
}

export const PossiblePrizes: React.FC<PossiblePrizesProps> = ({ prizes }) => {
  const sortedPrizes = [...prizes].sort((a, b) => b.price - a.price);
  
  return (
    <div className={styles.prizesSection}>
      <div className={styles.prizesTitle}>
        Possible prizes:
      </div>
      <div className={styles.prizesGrid}>
        {sortedPrizes.map((prize) => (
          <div key={prize.id} className={styles.prizeGridItem}>
            <img 
              src={prize.image}
              alt={prize.name}
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <div className={styles.prizePrice}>
              <img 
                src="/assets/images/ton.svg" 
                alt="TON" 
                style={{ width: '10px', height: '10px' }}
              />
              <span>{prize.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Экспорт как дефолтный компонент
export default SpinResultDisplay; 