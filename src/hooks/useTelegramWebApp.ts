import { useEffect, useState } from 'react';
import { TelegramWebApp } from '@/types/telegram';

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setWebApp(tg);
      
      // Инициализация
      tg.ready();
      
      // Разворачиваем на весь экран
      tg.expand();
      setIsExpanded(tg.isExpanded);
      
      // Настраиваем цвета
      tg.setHeaderColor('#141415');
      tg.setBackgroundColor('#141415');
      
      // Отключаем подтверждение закрытия
      tg.disableClosingConfirmation();
      
      // Обновляем CSS переменные для viewport
      const updateViewportHeight = () => {
        document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
      };
      
      updateViewportHeight();
      
      // Слушаем изменения viewport
      const handleViewportChanged = () => {
        updateViewportHeight();
        setIsExpanded(tg.isExpanded);
      };
      
      // Добавляем обработчик событий (если поддерживается)
      if ('onEvent' in tg) {
        tg.onEvent('viewportChanged', handleViewportChanged);
      }
      
      return () => {
        if ('offEvent' in tg) {
          tg.offEvent('viewportChanged', handleViewportChanged);
        }
      };
    }
  }, []);

  return {
    webApp,
    isExpanded,
    isAvailable: !!webApp
  };
}; 