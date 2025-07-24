import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { shouldUseGuestMode } from '@/utils/environment';
import './index.css';

// Импортируем типы из нового файла
import '@/types/telegram';

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
    
    console.log('Telegram WebApp initialized successfully');
  } catch (error) {
    console.error('Error initializing Telegram WebApp:', error);
  }
} else if (shouldUseGuestMode()) {
  console.log('Guest mode - skipping Telegram WebApp initialization');
} else {
  console.log('Telegram WebApp not available - running in fallback mode');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Suspense fallback={<LoadingScreen mode="simple" />}>
      <App />
    </Suspense>
  </React.StrictMode>
); 