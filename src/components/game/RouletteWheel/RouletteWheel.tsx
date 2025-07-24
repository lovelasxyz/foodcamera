// src/components/game/RouletteWheel/RouletteWheel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { Modal } from '@/components/ui/Modal';
import styles from './RouletteWheel.module.css';


// 🆕 Новый хук для улучшенной физики рулетки
const useRoulettePhysics = (isSpinning: boolean, finalPosition: number) => {
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    if (!isSpinning) {
      setPosition(0);
      return;
    }
    
    const startTime = Date.now();
    const duration = 4000; // 4 секунды
    const startPosition = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Улучшенная easing функция для более реалистичного замедления
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPosition = startPosition + (finalPosition * eased);
      
      setPosition(currentPosition);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isSpinning, finalPosition]);
  
  return position;
};

// 🆕 Хук для звуковых эффектов
const useSoundEffects = () => {
  const playSound = (soundType: 'spin' | 'win' | 'rare') => {
    if (typeof window === 'undefined') return;
    
    // Простые звуки через Web Audio API или можно использовать файлы
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const sounds = {
      spin: () => {
        // Звук вращения - низкочастотный гул
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
      },
      win: () => {
        // Звук выигрыша - мелодичный
        [261.63, 329.63, 392.00].forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
          
          oscillator.start(audioContext.currentTime + i * 0.1);
          oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
        });
      },
      rare: () => {
        // Звук редкого предмета - особенный
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);
      }
    };
    
    try {
      sounds[soundType]();
    } catch (error) {
      console.log('Sound not supported');
    }
  };
  
  return { playSound };
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
  const rouletteRef = useRef<HTMLDivElement>(null);

  // 🆕 Используем новую физику
  const [finalPosition, setFinalPosition] = useState(0);
  const currentPosition = useRoulettePhysics(isSpinning, finalPosition);
  
  // 🆕 Используем звуки
  const { playSound } = useSoundEffects();

  // Рассчитываем финальную позицию анимации
  const calculateFinalPosition = (winningIndex: number) => {
    if (!currentCase) return 0;
    
    const itemWidth = 108; // ширина элемента + gap (100px + 8px)
    const totalItems = currentCase.items.length;
    const baseSpins = 5; // количество полных оборотов для эффекта
    const baseDistance = baseSpins * totalItems * itemWidth;
    
    // Позиция выигрышного элемента для центрирования под курсором
    const winningPosition = winningIndex * itemWidth;
    const centerOffset = itemWidth / 2; // центрируем элемент под курсором
    
    return -(baseDistance + winningPosition - centerOffset);
  };

  const handleSpin = () => {
    if (!currentCase) return;

    if (user.balance < currentCase.price) {
      return;
    }
    
    // Списываем средства за спин
    updateBalance(-currentCase.price);
    
    // Рассчитываем случайный индекс выигрышного элемента
    const randomItemIndex = Math.floor(Math.random() * currentCase.items.length);
    
    // Устанавливаем финальную позицию анимации
    const position = calculateFinalPosition(randomItemIndex);
    setFinalPosition(position);
    
    // 🆕 Проигрываем звук вращения
    playSound('spin');
    
    startSpin(randomItemIndex);
  };

  const handleClose = () => {
    setFinalPosition(0);
    closeCase();
  };

  // 🆕 Проигрываем звук при выигрыше
  useEffect(() => {
    if (showResult && spinResult) {
      // const rarity = spinResult.prize.rarity || 'common';
      // if (rarity === 'legendary' || rarity === 'epic') {
      //   playSound('rare');
      // } else {
      //   playSound('win');
      // }
    }
  }, [showResult, spinResult, playSound]);

  // Сброс позиции после закрытия результата
  useEffect(() => {
    if (!showResult && !isSpinning && finalPosition !== 0) {
      const timer = setTimeout(() => {
        setFinalPosition(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResult, isSpinning, finalPosition]);

  const handleKeepPrize = () => {
    if (spinResult && currentCase) {
      addToInventory(spinResult.prize, currentCase.name);
      closeCase();
    }
  };

  const handleQuickSell = () => {
    if (spinResult) {
      // Добавляем цену приза к балансу пользователя
      updateBalance(spinResult.prize.price);
      closeCase();
    }
  };



  if (!currentCase) return null;

  // Создаем массив элементов для рулетки (дублируем для плавной анимации)
  const rouletteItems = [];
  for (let i = 0; i < 200; i++) {
    const item = currentCase.items[i % currentCase.items.length];
    rouletteItems.push({
      ...item,
      uniqueId: `${item.id}-${i}`
    });
  }

  const sortedPrizes = [...currentCase.items].sort((a, b) => b.price - a.price);

  const totalPrice = currentCase.price;
  const hasEnoughFunds = user.balance >= totalPrice;

  return (
    <Modal
      isOpen={!!currentCase}
      onClose={handleClose}
      title={currentCase.name}
      size="lg"
    >
      {!showResult ? (
        <div className={styles.rouletteContainer}>

          {/* Рулетка с новой физикой */}
          <div className={styles.rouletteViewport}>
            <div 
              className={styles.rouletteItems} 
              style={{ transform: `translateX(${currentPosition}px)` }}
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
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      className={styles.coinIcon}
                    />
                    <span>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.shadowRight} />
          </div>

          {/* Кнопки действий */}
          <div className={styles.actionButtons}>
            <button 
              className={styles.spinButton}
              onClick={handleSpin}
              disabled={isSpinning || !hasEnoughFunds}
            >
             <div className={styles.buttonLabel}>  {isSpinning ? 'Spinning...' : `Spin`} </div>
              
             <div className={styles.priceTag}>
              <div className={styles.priceValue}>{totalPrice.toFixed(2)}</div>
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
              Insufficient balance. Need {totalPrice.toFixed(2)} TON
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
                    <img 
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      style={{ width: '10px', height: '10px' }}
                    />
                    <span>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.modal}>
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
            <span style={{ fontSize: '16px', color: 'white' }}>✦</span>
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
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  ✦ ✦ ✦
                </div>
              </div>
            )}
          </div>
          </div>
          <div className={styles.resultActions}>
            <button onClick={handleKeepPrize} className={`${styles.spinButton} ${styles.centered}`}><div className={styles.buttonLabel}>Keep it</div></button>

            <button 
              className={styles.quickSellButton}
              onClick={handleQuickSell}
            >
              Quick Sell {spinResult?.prize.price}
              <img 
                src="/assets/images/ton.svg" 
                alt="TON" 
                style={{ width: '14px', height: '14px' }}
              />
            </button>
          </div>

          {/* Возможные призы в результате */}
          <div className={styles.prizesSection}>
            <div className={styles.prizesTitle}>Possible prizes:</div>
            <div className={styles.prizesGrid}>
              {sortedPrizes.slice(0, 9).map((item) => (
                <div key={item.id} className={styles.prizeGridItem}>
                  <img src={item.image} alt={item.name} />
                  <div className={styles.prizePrice}>
                    <img 
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      style={{ width: '10px', height: '10px' }}
                    />
                    <span>{item.price}</span>
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