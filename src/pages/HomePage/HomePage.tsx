import React from 'react';
import { useCasesStore } from '@/store/casesStore';
import { Header } from '@/components/layout/Header';
import { LiveStatusBar } from '@/components/layout/LiveStatusBar';
import { CaseGrid } from '@/components/widgets/CaseGrid/CaseGrid';
import { RouletteWheel } from '@/components/game/RouletteWheel';
import { ASSETS } from '@/constants/assets';
import { useI18n } from '@/i18n';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useCasesRealtime } from '@/hooks/useCasesRealtime';
import { BannerSlider, CasesStateView, useImagePreload, Slide } from './components';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const { t } = useI18n();
  const { cases, isLoading, loadCases } = useCasesStore();
  const isOnline = useOnlineStatus();
  useCasesRealtime(isOnline);
  const { preloadBannerAssets, preloadCaseImages } = useImagePreload();
  
  // Простое состояние
  const [hideCasesError, setHideCasesError] = React.useState(false);
  const [casesPhase, setCasesPhase] = React.useState<'idle' | 'loading' | 'error'>('idle');

  // Статический исходный набор слайдов (текст + изображения + mp4)
  const slides: Slide[] = [
    { kind: 'text', text: t('Free case') },
    { kind: 'image', image: ASSETS.IMAGES.DRAGON, href: 'https://t.me/BotFather' },
    { kind: 'video', video: ASSETS.VIDEOS.DARKSIDE, href: 'https://t.me/BotFather' },
    { kind: 'image', image: ASSETS.IMAGES.DIAMOND, href: 'https://t.me/BotFather' },
    { kind: 'image', image: ASSETS.IMAGES.GIFT },
    { kind: 'image', image: ASSETS.IMAGES.TEDDY, href: 'https://t.me/BotFather' },
    { kind: 'text', text: t('messages.freeBanner6') },
    { kind: 'text', text: t('messages.freeBanner7') },
  ];

  // Предзагрузка ресурсов баннеров (динамичных + fallback)
  React.useEffect(() => {
    const all = [
      ASSETS.IMAGES.LIGHTNING,
      ASSETS.IMAGES.DRAGON,
      ASSETS.IMAGES.DIAMOND,
      ASSETS.IMAGES.GIFT,
      ASSETS.IMAGES.TEDDY,
      ASSETS.IMAGES.TON,
      ASSETS.IMAGES.FREE_CASE_LABEL,
    ];
    preloadBannerAssets(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (dynamic banners disabled — original static variant restored)

  // Предзагрузка изображений кейсов
  React.useEffect(() => {
    if (cases.length > 0) {
      preloadCaseImages(cases);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases.length]);

  // Управление состоянием кейсов
  React.useEffect(() => {
    if (!isOnline) {
      setCasesPhase('loading');
      const timer = setTimeout(() => setCasesPhase('error'), 800);
      return () => clearTimeout(timer);
    }
    setCasesPhase(isLoading ? 'loading' : 'idle');
    if (!isLoading) setHideCasesError(false);
  }, [isOnline, isLoading]);

  // Загрузка кейсов при монтировании
  React.useEffect(() => {
    if (isOnline && cases.length === 0) {
      loadCases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обновление при возвращении на вкладку
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        loadCases();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return (
    <div className={styles.homePage}>
      <Header />
      
      <div className={styles.casesContainer}>
        {isOnline ? <LiveStatusBar /> : <div style={{ height: '20px' }} />}
        
        <BannerSlider slides={slides} />
        
        <CasesStateView
          isOnline={isOnline}
          isLoading={casesPhase === 'loading'}
          hasError={casesPhase === 'error' && !hideCasesError}
          onRetry={() => window.location.reload()}
          onHideError={() => setHideCasesError(true)}
        />
        
        {isOnline && (
          <CaseGrid
            cases={cases}
            loading={isLoading && casesPhase === 'idle'}
            showErrorBanner={false}
            showErrorState={false}
            onHideErrorBanner={() => setHideCasesError(true)}
            onRetry={() => window.location.reload()}
          />
        )}
      </div>
      
      <RouletteWheel />
    </div>
  );
};