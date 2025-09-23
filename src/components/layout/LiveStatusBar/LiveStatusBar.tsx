import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import styles from './LiveStatusBar.module.css';
import { useLiveStore } from '@/store/liveStore';

export const LiveStatusBar: React.FC = () => {
  const items = useLiveStore((s) => s.items);
  const lastAddedId = useLiveStore((s) => s.lastAddedId);
  const init = useLiveStore((s) => s.init);
  const stop = useLiveStore((s) => s.stop);
  const liveItemsRef = useRef<HTMLDivElement | null>(null);
  const didInitRef = useRef<boolean>(false);
  const [enterDoneId, setEnterDoneId] = useState<number | null>(null);
  const [itemsToShow, setItemsToShow] = useState<typeof items>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const didMountRef = useRef<boolean>(false);
  const lastShiftedIdRef = useRef<number | null>(null);

  useEffect(() => {
    init();
    return () => {
      try { stop(); } catch { /* ignore stop errors */ }
    };
  }, [init, stop]);

  // На первом монтировании помечаем текущий lastAddedId как уже анимированный,
  // чтобы при возврате на страницу не перезапускалась анимация появления.
  useLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (lastAddedId != null) {
        setEnterDoneId(lastAddedId);
        lastShiftedIdRef.current = lastAddedId;
      }
    }
  }, [lastAddedId]);

  // Функция для расчета количества элементов, которые помещаются в контейнер
  const calculateVisibleItems = useCallback(() => {
    const container = liveItemsRef.current;
    if (!container || items.length === 0) return;

    // Получаем ширину контейнера
    const containerWidth = container.offsetWidth;
    
    // Создаем временный элемент для измерения
    const tempDiv = document.createElement('div');
    tempDiv.className = styles.liveItem;
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.innerHTML = `
      <div class="${styles.liveItemContent}">
        <img src="" alt="" class="${styles.liveImage}" />
      </div>
    `;
    container.appendChild(tempDiv);
    
    // Измеряем ширину одного элемента
    const itemWidth = tempDiv.offsetWidth;
    
    // Получаем gap между элементами
    const computed = getComputedStyle(container);
    const gapStr = computed.columnGap || computed.gap || '0px';
    const gap = parseFloat(gapStr) || 0;
    
    // Удаляем временный элемент
    container.removeChild(tempDiv);
    
    // Рассчитываем сколько элементов помещается
    const totalItemWidth = itemWidth + gap;
    const visibleCount = Math.floor((containerWidth + gap) / totalItemWidth);
    
    // Берем нужное количество элементов или дублируем если их меньше
    let resultItems = [...items];
    
    // Если элементов меньше чем нужно для заполнения, дублируем их
    if (items.length < visibleCount && items.length > 0) {
      const timesToRepeat = Math.ceil(visibleCount / items.length) + 1; // +1 для запаса при анимации
      resultItems = [];
      for (let i = 0; i < timesToRepeat; i++) {
        resultItems.push(...items.map(item => ({
          ...item,
          // Добавляем уникальный ключ для React, сохраняя оригинальный id
          uniqueKey: `${item.id}_${i}`
        })));
      }
    }
    
    // Обрезаем до нужного количества + запас для анимации
    setItemsToShow(resultItems.slice(0, visibleCount + 2));
  }, [items]);

  // Пересчитываем при изменении размера контейнера
  useEffect(() => {
    const container = liveItemsRef.current;
    if (!container) return;

    // Начальный расчет
    calculateVisibleItems();

    // Создаем ResizeObserver для отслеживания изменений размера
    resizeObserverRef.current = new ResizeObserver(() => {
      calculateVisibleItems();
    });

    resizeObserverRef.current.observe(container);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [calculateVisibleItems]);

  // Пересчитываем при изменении элементов
  useEffect(() => {
    calculateVisibleItems();
  }, [items, calculateVisibleItems]);

  // Плавное смещение списка вправо при добавлении нового элемента слева
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    const container = liveItemsRef.current;
    if (!container) return;
    if (!itemsToShow.length) return;
    if (lastAddedId == null) return;
    if (lastShiftedIdRef.current === lastAddedId) return; // уже обработан

    // Запускаем только если первый элемент — именно что добавленный
    const firstItem = itemsToShow[0];
    const originalId = firstItem.id;
    if (originalId !== lastAddedId) return;

    const firstChild = container.firstElementChild as HTMLElement | null;
    const computed = getComputedStyle(container);
    const gapStr = computed.columnGap || computed.gap || '0px';
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
    lastShiftedIdRef.current = lastAddedId;
    return () => {
      container.removeEventListener('transitionend', handleEnd);
    };
  }, [itemsToShow, lastAddedId]);
  
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
        {itemsToShow.map((item) => {
          const originalId = item.id;
          const keyVal = (item as any).uniqueKey ?? item.id;
          const isNewlyAdded = originalId === lastAddedId && originalId !== enterDoneId;
          
          return (
            <div 
              key={keyVal}
              data-rarity={item.rarity}
              className={`${styles.liveItem} ${isNewlyAdded ? styles.liveItemEnter : ''}`}
              onAnimationEnd={(e) => {
                if (e.currentTarget !== e.target) return; // игнорируем события от дочерних элементов
                if (originalId === lastAddedId) {
                  setEnterDoneId(originalId);
                }
              }}
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