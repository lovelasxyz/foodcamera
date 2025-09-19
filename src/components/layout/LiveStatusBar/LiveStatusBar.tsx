import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [capacity, setCapacity] = useState<number>(0);

  useEffect(() => {
    init();
  }, []);

  // Рассчитываем, сколько элементов должно быть видно, чтобы заполнить всю ширину
  useEffect(() => {
    const container = liveItemsRef.current;
    if (!container) return;

    const ITEM_W = 50; // должно совпадать с css шириной liveItem
    const compute = () => {
      const rect = container.getBoundingClientRect();
      const computed = getComputedStyle(container);
      const gapStr = (computed as any).columnGap || (computed as any).gap || '3px';
      const gap = parseFloat(gapStr) || 3;
      const available = rect.width;
      const per = ITEM_W + gap;
      const count = Math.max(1, Math.floor((available + gap) / per));
      setCapacity(count);
    };

    // Инициализация и подписка на ресайз
    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(container);
    return () => ro.disconnect();
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

  // Формируем массив для отрисовки нужной длины: используем имеющиеся items,
  // при нехватке — дублируем существующие, чтобы заполнить всю ширину
  const renderItems = useMemo(() => {
    if (!capacity) return items;
    if (items.length >= capacity) return items.slice(0, capacity);
    if (items.length === 0) return items;
    const result = items.slice();
    let i = 0;
    while (result.length < capacity) {
      result.push(items[i % items.length]);
      i += 1;
    }
    return result;
  }, [items, capacity]);

  return (
    <div className={styles.liveStatusBar}>
      <div className={styles.liveIndicator}>
        <div className={styles.liveDot}>●</div>
        <div className={styles.liveText}>Live</div>
      </div>
      
      <div className={styles.liveItems} ref={liveItemsRef}>
        {renderItems.map((item, idx) => {
          // Анимируем только первое вхождение нового элемента
          let isNewlyAdded = false;
          if (item.id === lastAddedId && item.id !== enterDoneId) {
            // Проверяем, что это первое появление данного id среди renderItems
            const firstIndex = renderItems.findIndex((ri) => ri.id === item.id);
            isNewlyAdded = firstIndex === idx;
          }
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