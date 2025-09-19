import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { I18nProvider } from '@/i18n';
import { shouldUseGuestMode } from '@/utils/environment';
import './index.css';

// Импортируем типы из нового файла
import '@/types/telegram';
import '@/services/events/EventSubscriptions';

// Инициализация Telegram Web App (только в продакшене)
if (!shouldUseGuestMode() && window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  try {
    // Готовность приложения
    tg.ready();
    
    // Разворачиваем приложение на весь экран
    tg.expand();
    
    // Настраиваем цвета интерфейса
    tg.setHeaderColor('#141415');
    tg.setBackgroundColor('#141415');
    
    // Отключаем подтверждение закрытия для лучшего UX
    tg.disableClosingConfirmation();
        
    // Telegram WebApp initialized successfully (removed in production)
  } catch (error) {
    console.error('Error initializing Telegram WebApp:', error);
  }
} else if (shouldUseGuestMode()) {
  // Guest mode - skipping Telegram WebApp initialization (removed in production)
} else {
  // Telegram WebApp not available - running in fallback mode (removed in production)
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
);