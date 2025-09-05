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
      
      // Определяем версию и наличие методов, чтобы избежать предупреждений на старых версиях
      const version = parseFloat(((tg as any).version as string) || '0');

      // Настраиваем цвета, если поддерживается
      if (version >= 6.1 && typeof (tg as any).setHeaderColor === 'function') {
        try { tg.setHeaderColor('#141415'); } catch {}
      }
      if (version >= 6.1 && typeof (tg as any).setBackgroundColor === 'function') {
        try { tg.setBackgroundColor('#141415'); } catch {}
      }

      // Отключаем подтверждение закрытия, если поддерживается
      if (version >= 6.2 && typeof (tg as any).disableClosingConfirmation === 'function') {
        try { tg.disableClosingConfirmation(); } catch {}
      }
      
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