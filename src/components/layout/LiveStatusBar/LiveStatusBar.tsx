import React, { useEffect, useRef, useState } from 'react';
import styles from './LiveStatusBar.module.css';
import { useLiveStore } from '@/store/liveStore';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';

export const LiveStatusBar: React.FC = () => {
  const items = useLiveStore((s) => s.items);
  const lastAddedId = useLiveStore((s) => s.lastAddedId);
  const init = useLiveStore((s) => s.init);
  const liveItemsRef = useRef<HTMLDivElement | null>(null);
  const didInitRef = useRef<boolean>(false);
  const [enterDoneId, setEnterDoneId] = useState<number | null>(null);

  useEffect(() => {
    init();
  }, []);

  // Плавное смещение списка вправо при добавлении нового элемента слева
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    const container = liveItemsRef.current;
    if (!container) return;
    if (!items.length) return;

    // Запускаем только если первый элемент — именно что добавленный
    if (items[0]?.id !== lastAddedId) return;

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
  }, [items]);
  
  // Сбрасываем флаг завершения, когда приходит новый элемент
  useEffect(() => {
    if (lastAddedId != null) {
      setEnterDoneId(null);
    }
  }, [lastAddedId]);

  return (
    <div className={styles.liveStatusBar}>
      <div className={styles.liveIndicator}>
        <div className={styles.liveDot}>●</div>
        <div className={styles.liveText}>Live</div>
      </div>
      
      <div className={styles.liveItems} ref={liveItemsRef}>
        {items.map((item) => {
          const isNewlyAdded = item.id === lastAddedId && item.id !== enterDoneId;
          return (
          <div 
            key={item.id} 
            data-rarity={item.rarity}
            className={`${styles.liveItem} ${isNewlyAdded ? styles.liveItemEnter : ''}`}
            onAnimationEnd={(e) => {
              if (e.currentTarget !== e.target) return; // игнорируем события от дочерних элементов
              if (item.id === lastAddedId) {
                setEnterDoneId(item.id);
              }
            }}
          >
            <div className={styles.liveItemContent}>
              <ProgressiveImg 
                src={item.image} 
                alt={item.name} 
                className={styles.liveImage}
                cacheKey={String(item.id)}
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