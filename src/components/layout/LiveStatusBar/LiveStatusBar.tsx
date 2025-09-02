import React, { useState, useEffect, useRef } from 'react';
import { ASSETS } from '@/constants/assets';
import styles from './LiveStatusBar.module.css';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface LiveItem {
  id: number;
  image: string;
  name: string;
  price: number;
  userName: string;
  rarity: Rarity;
}

export const LiveStatusBar: React.FC = () => {
  const [liveItems, setLiveItems] = useState<LiveItem[]>([]);
  const lastAddedIdRef = useRef<number | null>(null);
  const liveItemsRef = useRef<HTMLDivElement | null>(null);
  const didInitRef = useRef<boolean>(false);

  // Базовые предметы (без id/userName/rarity)
  const baseMock: Array<{ image: string; name: string; price: number }> = [
    { image: ASSETS.IMAGES.FROG, name: 'Mystic Frog', price: 1562 },
    { image: ASSETS.IMAGES.DIAMOND, name: 'Diamond', price: 48.15 },
    { image: ASSETS.IMAGES.DRAGON, name: 'Dragon', price: 89.99 },
    { image: ASSETS.IMAGES.WIZARD_HAT, name: 'Wizard Hat', price: 35.20 },
    { image: ASSETS.IMAGES.HELMET, name: 'Knight Helmet', price: 75.50 },
    { image: ASSETS.IMAGES.SCROLL, name: 'Ancient Scroll', price: 120.00 },
    { image: ASSETS.IMAGES.TEDDY, name: 'Cursed Teddy', price: 66.60 },
    { image: ASSETS.IMAGES.GIFT, name: 'Mystery Gift', price: 25.00 },
    { image: ASSETS.IMAGES.LIGHTNING, name: 'Lightning', price: 42.50 },
    { image: ASSETS.IMAGES.BURGER, name: 'Burger', price: 12.3 },
    { image: ASSETS.IMAGES.TON, name: 'TON', price: 5.5 },
    { image: ASSETS.IMAGES.TOKEN, name: 'TON', price: 15.75 },
  ];

  // Детерминированная редкость по изображению (в синхроне со store)
  const RARITY_BY_IMAGE: Record<string, Rarity> = {
    [ASSETS.IMAGES.TEDDY]: 'common',
    [ASSETS.IMAGES.BURGER]: 'common',
    [ASSETS.IMAGES.SCROLL]: 'rare',
    [ASSETS.IMAGES.WIZARD_HAT]: 'rare',
    [ASSETS.IMAGES.HELMET]: 'rare',
    [ASSETS.IMAGES.GIFT]: 'rare',
    [ASSETS.IMAGES.DIAMOND]: 'epic',
    [ASSETS.IMAGES.DRAGON]: 'epic',
    [ASSETS.IMAGES.LIGHTNING]: 'epic',
    [ASSETS.IMAGES.FROG]: 'legendary',
    [ASSETS.IMAGES.TON]: 'common',
  };
  const resolveRarity = (image: string): Rarity => RARITY_BY_IMAGE[image] || 'common';

  useEffect(() => {
    const MAX_VISIBLE = 18;

    // Начальное заполнение, чтобы полоса не была пустой
    const initialItems = Array.from({ length: MAX_VISIBLE - 2 }, (_, i) => {
      const randomItem = baseMock[Math.floor(Math.random() * baseMock.length)];
      return {
        id: Date.now() + i,
        image: randomItem.image,
        name: randomItem.name,
        price: randomItem.price,
        userName: `User${Math.floor(Math.random() * 1000)}`,
        rarity: resolveRarity(randomItem.image),
      } as LiveItem;
    });
    setLiveItems(initialItems);

    // Единичное добавление элемента с интервалом
    const interval = setInterval(() => {
      const randomItem = baseMock[Math.floor(Math.random() * baseMock.length)];
      setLiveItems((prevItems) => {
        const nextItem: LiveItem = {
          id: Date.now(),
          image: randomItem.image,
          name: randomItem.name,
          price: randomItem.price,
          userName: `User${Math.floor(Math.random() * 1000)}`,
          rarity: resolveRarity(randomItem.image),
        };
        lastAddedIdRef.current = nextItem.id;
        const prepended = [nextItem, ...prevItems];
        if (prepended.length > MAX_VISIBLE) {
          prepended.pop();
        }
        return prepended;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Плавное смещение списка вправо при добавлении нового элемента слева
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    const container = liveItemsRef.current;
    if (!container) return;
    if (!liveItems.length) return;

    // Запускаем только если первый элемент — именно что добавленный
    if (liveItems[0]?.id !== lastAddedIdRef.current) return;

    const firstChild = container.firstElementChild as HTMLElement | null;
    const computed = getComputedStyle(container);
    const gapStr = (computed as any).columnGap || (computed as any).gap || '0px';
    const gap = parseFloat(gapStr) || 0;
    const itemWidth = firstChild ? firstChild.getBoundingClientRect().width : 50;
    const shift = itemWidth + gap;

    // Начальное мгновенное смещение влево на ширину нового элемента + gap,
    // затем анимация обратно к нулю, создающая эффект плавного сдвига вправо
    container.style.transition = 'none';
    container.style.transform = `translateX(-${shift}px)`;
    // Двойной rAF для надёжного запуска анимации без дёрганий
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.style.transition = 'transform 550ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        container.style.transform = 'translateX(0)';
      });
    });

    const handleEnd = () => {
      container.style.transition = '';
      container.style.transform = '';
      container.removeEventListener('transitionend', handleEnd);
    };
    container.addEventListener('transitionend', handleEnd);
    return () => {
      container.removeEventListener('transitionend', handleEnd);
    };
  }, [liveItems]);

  return (
    <div className={styles.liveStatusBar}>
      <div className={styles.liveIndicator}>
        <div className={styles.liveDot}>●</div>
        <div className={styles.liveText}>Live</div>
      </div>
      
      <div className={styles.liveItems} ref={liveItemsRef}>
        {liveItems.map((item) => {
          const isNewlyAdded = item.id === lastAddedIdRef.current;
          return (
          <div 
            key={item.id} 
            data-rarity={item.rarity}
            className={`${styles.liveItem} ${isNewlyAdded ? styles.liveItemEnter : ''}`}
          >
            <div className={styles.liveItemContent}>
              <img 
                src={item.image} 
                alt={item.name} 
                className={styles.liveImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}; 