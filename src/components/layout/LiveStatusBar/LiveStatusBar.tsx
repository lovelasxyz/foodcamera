import React, { useState, useEffect } from 'react';
import { ASSETS } from '@/constants/assets';
import styles from './LiveStatusBar.module.css';

interface LiveItem {
  id: number;
  image: string;
  name: string;
  price: number;
  userName: string;
}

export const LiveStatusBar: React.FC = () => {
  const [liveItems, setLiveItems] = useState<LiveItem[]>([]);

  // Расширенные моковые данные для демонстрации
  const mockLiveItems: LiveItem[] = [
    { id: 1, image: ASSETS.IMAGES.FROG, name: 'Mystic Frog', price: 1562, userName: 'Player123' },
    { id: 2, image: ASSETS.IMAGES.DIAMOND, name: 'Diamond', price: 48.15, userName: 'GamerX' },
    { id: 3, image: ASSETS.IMAGES.DRAGON, name: 'Dragon', price: 89.99, userName: 'CoolUser' },
    { id: 4, image: ASSETS.IMAGES.WIZARD_HAT, name: 'Wizard Hat', price: 35.20, userName: 'MagicFan' },
    { id: 5, image: ASSETS.IMAGES.HELMET, name: 'Knight Helmet', price: 75.50, userName: 'SirLoot' },
    { id: 6, image: ASSETS.IMAGES.SCROLL, name: 'Ancient Scroll', price: 120.00, userName: 'Explorer' },
    { id: 7, image: ASSETS.IMAGES.TEDDY, name: 'Cursed Teddy', price: 66.60, userName: 'Spooky' },
    { id: 10, image: ASSETS.IMAGES.GIFT, name: 'Mystery Gift', price: 25.00, userName: 'Lucky' },
    { id: 11, image: ASSETS.IMAGES.BURGER, name: 'Legendary Burger', price: 99.99, userName: 'Foodie' },
  ];

  useEffect(() => {
    // Генерируем большое количество начальных элементов, чтобы заполнить экран
    const initialItems = Array.from({ length: 40 }, (_, i) => {
        const randomItem = mockLiveItems[Math.floor(Math.random() * mockLiveItems.length)];
        return {
            ...randomItem,
            id: Date.now() + i, // уникальный id
            userName: `User${Math.floor(Math.random() * 1000)}`
        };
    });
    setLiveItems(initialItems);

    // Симулируем периодическое обновление
    const interval = setInterval(() => {
      const randomItem = mockLiveItems[Math.floor(Math.random() * mockLiveItems.length)];
      setLiveItems(prevItems => {
        const newItems = [...prevItems];
        newItems.shift(); // убираем первый элемент
        newItems.push({
          ...randomItem,
          id: Date.now(), // новый ID для анимации
          userName: `User${Math.floor(Math.random() * 1000)}`
        });
        return newItems;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.liveStatusBar}>
      <div className={styles.liveIndicator}>
        <div className={styles.liveDot}>●</div>
        <div className={styles.liveText}>Live</div>
      </div>
      
      <div className={styles.liveItems}>
        {liveItems.map((item, index) => (
          <div 
            key={`${item.id}-${index}`} 
            className={styles.liveItem}
            style={{ animationDelay: `${index * 0.1}s` }}
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
        ))}
      </div>
    </div>
  );
}; 