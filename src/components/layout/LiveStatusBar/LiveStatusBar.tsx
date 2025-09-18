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
  const [minVisibleCount, setMinVisibleCount] = useState<number>(0);

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

  // Обеспечиваем заполнение контейнера элементами на широких экранах
  useEffect(() => {
    const container = liveItemsRef.current;
    if (!container) return;

    const computeRequired = () => {
      const computed = getComputedStyle(container);
      const gapStr = (computed as any).columnGap || (computed as any).gap || '0px';
      const gap = parseFloat(gapStr) || 0;
      const firstChild = container.firstElementChild as HTMLElement | null;
      const itemWidth = firstChild ? firstChild.getBoundingClientRect().width : 50;
      const total = itemWidth + gap;
      const width = container.getBoundingClientRect().width;
      if (total > 0 && width > 0) {
        const required = Math.ceil(width / total) + 1; // +1 чтобы гарантированно покрыть правый край
        setMinVisibleCount(required);
      }
    };

    computeRequired();

    const observer = new ResizeObserver(() => {
      computeRequired();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [items.length]);

  const displayedItems = React.useMemo(() => {
    if (!items || items.length === 0) return [];
    if (items.length >= minVisibleCount || minVisibleCount === 0) return items;
    const extended: typeof items = [...items];
    let i = 0;
    while (extended.length < minVisibleCount) {
      extended.push(items[i % items.length]);
      i += 1;
    }
    return extended;
  }, [items, minVisibleCount]);

  return (
    <div className={styles.liveStatusBar}>
      <div className={styles.liveIndicator}>
        <div className={styles.liveDot}>●</div>
        <div className={styles.liveText}>Live</div>
      </div>
      
      <div className={styles.liveItems} ref={liveItemsRef}>
        {displayedItems.map((item, idx) => {
          const isNewlyAdded = idx === 0 && item.id === lastAddedId && item.id !== enterDoneId;
          return (
          <div 
            key={`${item.id}-${idx}`} 
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
              />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}; 