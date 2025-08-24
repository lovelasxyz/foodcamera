// src/components/game/RouletteWheel/RouletteWheel.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { Modal } from '@/components/ui/Modal';
import styles from './RouletteWheel.module.css';
import useSoundEffects from '@/hooks/useSoundEffects';
import { ROULETTE_CONFIG } from '@/types/game';
import { Prize } from '@/types/game';
import { RouletteEngine } from '@/domain/roulette/RouletteEngine';
import { SpinUseCase } from '@/application/roulette/SpinUseCase';
import { ASSETS } from '@/constants/assets';

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
  const { showWinModal, setShowWinModal, setActivePage, openModal } = useUIStore();
  const { playSound } = useSoundEffects();

  const [position, setPosition] = useState(0);
  const [instantPosition, setInstantPosition] = useState(false);
  const [targetReplicaIndex, setTargetReplicaIndex] = useState<number | null>(null);
  const [previewPrize, setPreviewPrize] = useState<Prize | null>(null);
  const clickLockRef = useRef(false);
  const awardedRef = useRef(false);

  const resetRoulette = () => {
    setPosition(0);
    setTargetReplicaIndex(null);
  };

  const handleAnimationEnd = () => {
    if (isSpinning) {
      setTimeout(() => {
        if (!showWinModal && spinResult && currentCase) {
          addToInventory(spinResult.prize, currentCase.name);
          awardedRef.current = true;
          useGameStore.setState({ isSpinning: false }); 
        } else {
          endSpin();
        }
        clickLockRef.current = false;
      }, 1000); // Задержка в 1.5 секунды
    } else {
      clickLockRef.current = false;
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

  const engine = useMemo(() => new RouletteEngine(ROULETTE_CONFIG), []);
  const spinUseCase = useMemo(() => new SpinUseCase(engine, { updateBalance, addToInventory }), [engine, updateBalance, addToInventory]);

  // Логика генерации результата вынесена в SpinUseCase / RouletteEngine

  const handleSpin = () => {
    if (!currentCase || isSpinning || clickLockRef.current) return;
    if (!spinUseCase.canAfford(currentCase, user.balance)) return;

    clickLockRef.current = true;
    awardedRef.current = false;

    setTargetReplicaIndex(null);

    playSound('spin');
    const result = spinUseCase.beginSpin(currentCase, user.balance, rouletteItems.length);
    if (!result) { clickLockRef.current = false; return; }

    // Мгновенный сброс без анимации
    setInstantPosition(true);
    setPosition(0);

    // Следующий кадр: включаем анимацию и двигаем к цели
    requestAnimationFrame(() => {
      setInstantPosition(false);
      startSpin(result.prizeIndex);
      setPosition(result.position);
      setTargetReplicaIndex(result.targetDomIndex);
    });
  };

  const handleDepositRedirect = () => {
    // Перенаправляем в профиль и открываем модалку депозита
    setActivePage('profile');
    openModal('deposit');
  };

  const handleClose = () => {
    // Сбросим блокировку кликов, чтобы можно было снова крутить после повторного открытия
    clickLockRef.current = false;
    if (spinResult && currentCase && !awardedRef.current) {
      addToInventory(spinResult.prize, currentCase.name);
      awardedRef.current = true;
    }
    resetRoulette();
    closeCase();
  };

  const handleKeepPrize = () => {
    if (spinResult && currentCase) {
      addToInventory(spinResult.prize, currentCase.name);
      awardedRef.current = true;
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
    <>
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
                transition: isSpinning && !instantPosition ? `transform ${ROULETTE_CONFIG.SPIN_DURATION}ms cubic-bezier(0.1, 0, 0.2, 1)` : 'none'
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
                      src={ASSETS.IMAGES.TON} 
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
                    <img src={ASSETS.IMAGES.UNION} className={styles.unionTop} alt="" />
                    <img src={ASSETS.IMAGES.UNION} className={styles.unionBottom} alt="" />
                  </div> 
            
            <div className={styles.shadowRight} />
          </div>

          {/* Кнопки */}
          <div className={styles.actionButtons}>
            {hasEnoughFunds ? (
              <button 
                className={styles.keepButton}
                onClick={handleSpin}
                disabled={isSpinning}
              >
                <div className={styles.buttonLabel}>
                  {isSpinning ? 'Spinning...' : 'Spin'}
                </div>
                <div className={styles.priceTag}>
                  <div className={styles.priceValue}>{(currentCase?.price ?? 0).toFixed(2)}</div>
                  <div className={styles.coinSmall}>
                    <div className={styles.coin}>
                      <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Not enough funds
                </div>
                <button 
                  className={`${styles.spinButton} ${styles.centered}`}
                  onClick={handleDepositRedirect}
                  disabled={isSpinning}
                >
                  <div className={styles.buttonLabel}>Deposit</div>
                </button>
              </>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'left',
            alignItems: 'center',
            marginLeft: '14px',
            color: 'grey',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              id="show-win-modal"
              checked={showWinModal}
              onChange={(e) => setShowWinModal(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="show-win-modal">Показывать выигрыш</label>
          </div>


          {/* Возможные призы */}
          <div className={styles.prizesSection}>
            <div className={styles.prizesTitle}>Possible prizes:</div>
            <div className={styles.prizesGrid}>
              {sortedPrizes.map((item) => (
                <div key={item.id} className={styles.prizeGridItem} data-rarity={item.rarity} onClick={() => setPreviewPrize(item)} style={{ cursor: 'pointer' }}>
                  <img src={item.image} alt={item.name} />
                    <div className={styles.prizeHint}>
                      <img 
                        src={ASSETS.IMAGES.TON} 
                        alt="TON" 
                        className={styles.coinIcon}
                      />
                      <div className={styles.price}> <span>{item.price}</span></div>
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
              src={ASSETS.IMAGES.TON} 
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
                   <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                 </div>
               </div>
               </div>
        </button>
            
          </div>

          {/* Возможные призы */}
          <div className={styles.prizesSection}>
            <div className={styles.prizesTitle}>Possible prizes:</div>
            <div className={styles.prizesGrid}>
              {sortedPrizes.map((item) => (
                <div key={item.id} className={styles.prizeGridItem} data-rarity={item.rarity} onClick={() => setPreviewPrize(item)} style={{ cursor: 'pointer' }}>
                  <img src={item.image} alt={item.name} />
                  <div className={styles.prizePrice}>
                    <div className={styles.prizeHint}>
                      <img 
                        src={ASSETS.IMAGES.TON} 
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
    {/* Preview prize modal */}
    <Modal
      key="preview"
      isOpen={!!previewPrize}
      onClose={() => setPreviewPrize(null)}
      title={previewPrize?.name}
      size="md"
    >
      {previewPrize && (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src={previewPrize.image} alt={previewPrize.name} style={{ width: 220, height: 220, objectFit: 'contain' }} />
            </div>
            {!!previewPrize.description && (
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.4 }}>
                {previewPrize.description}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ color: '#9CA3AF' }}>Rarity</div>
              <div style={{ textAlign: 'right', textTransform: 'capitalize' }}>{previewPrize.rarity}</div>
              <div style={{ color: '#9CA3AF' }}>Price</div>
              <div style={{ textAlign: 'right' }}>{previewPrize.price.toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            
            </div>
          </div>
        </div>
      )}
    </Modal>
    </>
  );
};