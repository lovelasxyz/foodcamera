// src/components/game/RouletteWheel/RouletteWheel.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { Modal } from '@/components/ui/Modal';
import styles from './RouletteWheel.module.css';
import useSoundEffects from '@/hooks/useSoundEffects';
import { ROULETTE_CONFIG } from '@/types/game';

export const RouletteWheel: React.FC = () => {
  const { 
    currentCase, 
    isSpinning, 
    spinResult, 
    showResult, 
    startSpin, 
    closeCase,
    endSpin,
    resetForNextSpin
  } = useGameStore();
  const { user, addToInventory, updateBalance } = useUserStore();
  const { playSound } = useSoundEffects();

  const [position, setPosition] = useState(0);
  const [targetReplicaIndex, setTargetReplicaIndex] = useState<number | null>(null);

  const resetRoulette = () => {
    setPosition(0);
    setTargetReplicaIndex(null);
  };

  const handleAnimationEnd = () => {
    if (isSpinning) {
      endSpin();
    }
  };

  const rouletteItems = useMemo(() => {
    if (!currentCase) return [];
    
    const items = [];
    const totalItemsInCase = currentCase.items.length;
    // Уменьшаем количество элементов для более плавной и медленной прокрутки
    const neededElements = 5 * totalItemsInCase * 2; 
    const reelLength = Math.max(neededElements, 300);

    for (let i = 0; i < reelLength; i++) {
      const originalIndex = i % totalItemsInCase;
      const item = currentCase.items[originalIndex];
      items.push({
        ...item,
        uniqueId: `roulette-${i}`,
        originalIndex: originalIndex
      });
    }
    return items;
  }, [currentCase]);

  // ПРОСТОЙ АЛГОРИТМ: определяем приз и позицию одновременно
  const generateSpinResult = () => {
    if (!currentCase) return { position: 0, prize: null, prizeIndex: 0, targetDomIndex: 0 };

    const ITEM_WIDTH = ROULETTE_CONFIG.ITEM_WIDTH;
    const totalItems = currentCase.items.length;
    const reelLength = rouletteItems.length;
    const containerCenter = (reelLength * ITEM_WIDTH) / 2;

    // 1. Выбираем случайный приз
    const randomPrizeIndex = Math.floor(Math.random() * totalItems);
    const selectedPrize = currentCase.items[randomPrizeIndex];

    // 2. Определяем целевую зону в дальней части ленты (75%-95% длины)
    const targetZoneStart = Math.floor(reelLength * 0.75);
    const targetZoneEnd = Math.floor(reelLength * 0.95);
    const randomBaseIndex = targetZoneStart + Math.floor(Math.random() * (targetZoneEnd - targetZoneStart));

    // 3. Находим первый доступный индекс для нашего приза
    let targetDomIndex = randomBaseIndex;
    while (targetDomIndex % totalItems !== randomPrizeIndex) {
      targetDomIndex++;
      // Циклический поиск в пределах зоны, если вышли за край
      if (targetDomIndex >= targetZoneEnd) {
        targetDomIndex = targetZoneStart;
      }
    }

    // 4. Центр целевого DOM-элемента
    const itemCenter = targetDomIndex * ITEM_WIDTH + ITEM_WIDTH / 2;

    // 5. Добавляем случайное смещение для неточной остановки
    const randomOffset = (Math.random() - 0.5) * ITEM_WIDTH * 0.8;

    // 6. Финальная позиция
    const finalPosition = containerCenter - itemCenter + randomOffset;

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
    
    setPosition(result.position);
    setTargetReplicaIndex(result.targetDomIndex);
    
    // Запускаем анимацию
    startSpin(result.prizeIndex);
  };

  const handleClose = () => {
    resetRoulette();
    closeCase();
  };

  const handleKeepPrize = () => {
    if (spinResult && currentCase) {
      addToInventory(spinResult.prize, currentCase.name);
      resetForNextSpin();
      resetRoulette();
    }
  };

  const handleQuickSell = () => {
    if (spinResult) {
      updateBalance(spinResult.prize.price);
      resetForNextSpin();
      resetRoulette();
    }
  };

  // Сброс после закрытия
  useEffect(() => {
    if (!showResult && !isSpinning) {
      const timer = setTimeout(() => {
        resetRoulette();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResult, isSpinning]);

  const sortedPrizes = useMemo(() => {
    if (!currentCase) return [];
    return [...currentCase.items].sort((a, b) => b.price - a.price);
  }, [currentCase]);

  const hasEnoughFunds = user.balance >= (currentCase?.price ?? 0);

  return (
    <Modal
      isOpen={!!currentCase}
      onClose={handleClose}
      title={currentCase?.name || ''}
      size="lg"
    >
      {!showResult ? (
        <div className={styles.rouletteContainer}>
    

          {/* Рулетка */}
          <div className={styles.rouletteViewport}>
            <div 
              className={styles.rouletteItems} 
              onTransitionEnd={handleAnimationEnd}
              style={{
                transform: `translate(-50%, -50%) translateX(${position}px)`,
                transition: isSpinning ? `transform ${ROULETTE_CONFIG.SPIN_DURATION}ms cubic-bezier(0.1, 0, 0.2, 1)` : 'none'
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
                <div className={styles.priceValue}>{(currentCase?.price ?? 0).toFixed(2)}</div>
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
              Insufficient balance. Need {(currentCase?.price ?? 0).toFixed(2)} TON
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