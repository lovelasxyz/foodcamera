// src/components/game/RouletteWheel/RouletteWheel.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { Modal } from '@/components/ui/Modal';
import styles from './RouletteWheel.module.css';
import useSoundEffects from '@/hooks/useSoundEffects';
import { ROULETTE_CONFIG } from '@/types/game';

// Простой хук для плавной анимации
const useRouletteAnimation = (isSpinning: boolean, targetPosition: number) => {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    if (!isSpinning) {
      setPosition(0);
      return;
    }
    
    const startTime = Date.now();
    const duration = ROULETTE_CONFIG.SPIN_DURATION;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function для плавного замедления
      const eased = ROULETTE_CONFIG.ANIMATION_EASING(progress);
      const currentPosition = targetPosition * eased;
      
      setPosition(currentPosition);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isSpinning, targetPosition]);
  
  return position;
};

export const RouletteWheel: React.FC = () => {
  const { 
    currentCase, 
    isSpinning, 
    spinResult, 
    showResult, 
    startSpin, 
    closeCase 
  } = useGameStore();
  const { user, addToInventory, updateBalance } = useUserStore();
  const { playSound } = useSoundEffects();

  const [targetPosition, setTargetPosition] = useState(0);
  const [targetReplicaIndex, setTargetReplicaIndex] = useState<number | null>(null);
  const currentPosition = useRouletteAnimation(isSpinning, targetPosition);

  // ПРОСТОЙ АЛГОРИТМ: определяем приз и позицию одновременно
  const generateSpinResult = () => {
    if (!currentCase) return { position: 0, prize: null, prizeIndex: 0, targetDomIndex: 0 };
    
    // Используем единый шаг элемента (ширина + gap) из конфигурации
    const ITEM_WIDTH = ROULETTE_CONFIG.ITEM_WIDTH;
    const totalItems = currentCase.items.length;

    // Длина визуальной ленты (кол-во отрендеренных элементов)
    const neededElements = 7 * totalItems * 2;
    const safeElements = Math.max(neededElements, 300);
    const containerCenter = (safeElements * ITEM_WIDTH) / 2;

    // 1. Выбираем случайный приз
    const randomPrizeIndex = Math.floor(Math.random() * totalItems);
    const selectedPrize = currentCase.items[randomPrizeIndex];

    // 2. Рассчитываем число оборотов так, чтобы целевой элемент оказался около центра ленты
    const centerSpins = Math.max(3, Math.floor(safeElements / 2 / totalItems) - 1);
    const extraSpins = Math.floor(Math.random() * 2); // небольшая вариативность 0..1 оборот
    const spins = centerSpins + extraSpins;

    // 3. Индекс целевого DOM-элемента в длинной ленте
    const targetDomIndex = spins * totalItems + randomPrizeIndex;

    // 4. Центр целевого DOM-элемента
    const itemCenter = targetDomIndex * ITEM_WIDTH + ITEM_WIDTH / 2;

    // 5. Нам нужно совместить центр контейнера с центром целевого элемента
    const finalPosition = containerCenter - itemCenter;
    
    return {
      position: finalPosition,
      prize: selectedPrize,
      prizeIndex: randomPrizeIndex,
      targetDomIndex
    };
  };

  const handleSpin = () => {
    if (!currentCase) return;
    if (user.balance < currentCase.price) return;
    
    playSound('spin');
    // Списываем средства
    updateBalance(-currentCase.price);
    
    // Генерируем результат
    const result = generateSpinResult();
    
    setTargetPosition(result.position);
    setTargetReplicaIndex(result.targetDomIndex);
    
    // Запускаем анимацию
    startSpin(result.prizeIndex);
  };

  const handleClose = () => {
    setTargetPosition(0);
    setTargetReplicaIndex(null);
    closeCase();
  };

  const handleKeepPrize = () => {
    if (spinResult && currentCase) {
      addToInventory(spinResult.prize, currentCase.name);
      closeCase();
    }
  };

  const handleQuickSell = () => {
    if (spinResult) {
      updateBalance(spinResult.prize.price);
      closeCase();
    }
  };

  // Сброс после закрытия
  useEffect(() => {
    if (!showResult && !isSpinning) {
      const timer = setTimeout(() => {
        setTargetPosition(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResult, isSpinning]);

  if (!currentCase) return null;

  // Создаем МНОГО элементов для гарантированного покрытия
  const rouletteItems = [];
  const totalItemsInCase = currentCase.items.length;
  
  // Создаем достаточно элементов: 
  // Максимум 7 оборотов * количество призов * 2 (запас)
  const neededElements = 7 * totalItemsInCase * 2;
  const safeElements = Math.max(neededElements, 300); // минимум 300
  
  for (let i = 0; i < safeElements; i++) {
    const originalIndex = i % totalItemsInCase;
    const item = currentCase.items[originalIndex];
    
    rouletteItems.push({
      ...item,
      uniqueId: `roulette-${i}`,
      originalIndex: originalIndex
    });
  }

  const sortedPrizes = [...currentCase.items].sort((a, b) => b.price - a.price);
  const hasEnoughFunds = user.balance >= currentCase.price;

  return (
    <Modal
      isOpen={!!currentCase}
      onClose={handleClose}
      title={currentCase.name}
      size="lg"
    >
      {!showResult ? (
        <div className={styles.rouletteContainer}>
    

          {/* Рулетка */}
          <div className={styles.rouletteViewport}>
            <div 
              className={styles.rouletteItems} 
              style={{ 
                transform: `translate(-50%, -50%) translateX(${currentPosition}px)`
              }}
            >
              {rouletteItems.map((item, index) => (
                <div 
                  key={item.uniqueId} 
                  className={`${styles.rouletteItem} ${index === targetReplicaIndex ? styles.highlighted : ''}`} 
                  data-rarity={item.rarity || 'common'}
                  data-index={index}
                  data-original-index={item.originalIndex}
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                  />
                  <div className={styles.prizeHint}>
                    <img 
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      className={styles.coinIcon}
                    />
                    <div className={styles.price}> <span>{item.price}</span></div>
                  </div>
                </div>
                
              ))}
            </div>
             <div className={styles.bg}></div>

                 <div className={styles.pointersContainer}>
                    <img src="/assets/images/Union.svg" className={styles.unionTop} alt="" />
                    <img src="/assets/images/Union.svg" className={styles.unionBottom} alt="" />
                  </div> 
            
            <div className={styles.shadowRight} />
          </div>

          {/* Кнопки */}
          <div className={styles.actionButtons}>
            <button 
              className={styles.spinButton}
              onClick={handleSpin}
              disabled={isSpinning || !hasEnoughFunds}
            >
              <div className={styles.buttonLabel}>
                {isSpinning ? 'Spinning...' : 'Spin'}
              </div>
              <div className={styles.priceTag}>
                <div className={styles.priceValue}>{currentCase.price.toFixed(2)}</div>
                <div className={styles.coinSmall}>
                  <div className={styles.coin}>
                    <img className={styles.coinImage} src="/assets/images/ton.svg" alt="Coin" />
                  </div>
                </div>
              </div>
            </button>
          </div>

          {!hasEnoughFunds && (
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '14px',
              marginTop: '12px'
            }}>
              Insufficient balance. Need {currentCase.price.toFixed(2)} TON
            </div>
          )}

          {/* Возможные призы */}
          <div className={styles.prizesSection}>
            <div className={styles.prizesTitle}>Possible prizes:</div>
            <div className={styles.prizesGrid}>
              {sortedPrizes.map((item) => (
                <div key={item.id} className={styles.prizeGridItem}>
                  <img src={item.image} alt={item.name} />
                  <div className={styles.prizePrice}>
                    <div className={styles.prizeHint}>
                    <img 
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      className={styles.coinIcon}
                    />
                    <div className={styles.price}> <span>{item.price}</span></div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.resultContainer}>
          <div style={{ 
            fontSize: '18px', 
            color: 'rgba(255, 255, 255, 0.7)', 
            marginBottom: '8px' 
          }}>
            {spinResult?.prize.name}
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
            <span>{spinResult?.prize.price}</span>
          </div>

          <div className={styles.resultPrize}>
            {spinResult && (
              <div style={{ 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                position: 'relative'
              }}>
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
            )}
          </div>

          <div className={styles.resultActions}>
            <button onClick={handleKeepPrize} className={`${styles.spinButton} ${styles.centered}`}>
              <div className={styles.buttonLabel}>Keep it</div>
            </button>
 <button 
          className={styles.quickSellButton}
          onClick={handleQuickSell}
          disabled={isSpinning || !hasEnoughFunds}
        >
                <div className={styles.buttonLabel}> Quick Sell </div>
              
              <div className={styles.priceTag}>
               <div className={styles.priceValue}>{spinResult?.prize.price.toFixed(2)}</div>
               <div className={styles.coinSmall}>
                 <div className={styles.coin}>
                   <img className={styles.coinImage} src="/assets/images/ton.svg" alt="Coin" />
                 </div>
               </div>
               </div>
        </button>
            
          </div>

          {/* Возможные призы */}
          <div className={styles.prizesSection}>
            <div className={styles.prizesTitle}>Possible prizes:</div>
            <div className={styles.prizesGrid}>
              {sortedPrizes.slice(0, 9).map((item) => (
                <div key={item.id} className={styles.prizeGridItem}>
                  <img src={item.image} alt={item.name} />
                  <div className={styles.prizePrice}>
                    <div className={styles.prizeHint}>
                    <img 
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      className={styles.coinIcon}
                    />
                    <div className={styles.price}> <span>{item.price}</span></div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};