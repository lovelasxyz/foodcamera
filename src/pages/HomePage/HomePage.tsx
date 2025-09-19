import React from 'react';
import { useCasesStore } from '@/store/casesStore';
import { Header } from '@/components/layout/Header';
import { LiveStatusBar } from '@/components/layout/LiveStatusBar';
// import { CaseCard } from '@/components/game/CaseCard';
import { CaseGrid } from '@/components/widgets/CaseGrid/CaseGrid';
import { RouletteWheel } from '@/components/game/RouletteWheel';
import { Button } from '@/components/ui/Button';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';
import { ASSETS } from '@/constants/assets';
import { useI18n } from '@/i18n';
import styles from './HomePage.module.css';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { imageCache } from '@/services/ImageCache';

export const HomePage: React.FC = () => {
  const { t } = useI18n();
  const { cases, isLoading, loadCases } = useCasesStore();
  const isOnline = useOnlineStatus();
  const [hideCasesError, setHideCasesError] = React.useState(false);
  const [casesPhase, setCasesPhase] = React.useState<'idle' | 'loading' | 'error'>('idle');
  // Preload critical assets for banner to avoid flicker on low-tier devices
  React.useEffect(() => {
    const bannerAssets: string[] = [
      ASSETS.IMAGES.LIGHTNING,
      ASSETS.IMAGES.DRAGON,
      ASSETS.IMAGES.DIAMOND,
      ASSETS.IMAGES.GIFT,
      ASSETS.IMAGES.TEDDY,
    ];
    // Используем более консервативные настройки для слабых устройств
    const concurrency = Math.max(1, Math.min(2, navigator.hardwareConcurrency || 2));
    imageCache.preload(bannerAssets, { concurrency });
  }, []);

  // Переходы для списка кейсов: во время реальной загрузки (isLoading) или при офлайне
  React.useEffect(() => {
    if (!isOnline) {
      setCasesPhase('loading');
      const t = setTimeout(() => setCasesPhase('error'), 800);
      return () => clearTimeout(t);
    }
    if (isLoading) {
      setCasesPhase('loading');
    } else {
      setCasesPhase('idle');
      setHideCasesError(false);
    }
  }, [isOnline, isLoading]);

  const touchStartXRef = React.useRef<number>(0);
  const touchDeltaXRef = React.useRef<number>(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [shadowColor, setShadowColor] = React.useState<string>('rgba(63, 188, 255, 0.35)');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  type Slide = { kind: 'text' | 'image' | 'video'; text?: string; image?: string; video?: string; href?: string };
  const slides = React.useMemo<Slide[]>(
    () => [
      { kind: 'text', text: t('Free case') },
     { kind: 'image', image: ASSETS.IMAGES.DRAGON, href: 'https://t.me/BotFather' },
    // { kind: 'text', text: "New cases. Welcome!" },
     { kind: 'video', video: ASSETS.VIDEOS.DARKSIDE, href: 'https://t.me/BotFather' },
    // { kind: 'text', text: "New cases. Welcome!" },
     { kind: 'image', image: ASSETS.IMAGES.DIAMOND, href: 'https://t.me/BotFather' },
    // { kind: 'text', text: "New cases. Welcome!" },
      { kind: 'image', image: ASSETS.IMAGES.GIFT },
   // { kind: 'text', text: "New cases. Welcome!" },
     { kind: 'image', image: ASSETS.IMAGES.TEDDY, href: 'https://t.me/BotFather' },
      { kind: 'text', text: t('messages.freeBanner6') },
      { kind: 'text', text: t('messages.freeBanner7') },
    ],
    [t]
  );

  const computeAverageColorFromImage = React.useCallback((src: string): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      const resolved = imageCache.getCachedSrc(src);
      if (resolved === src) {
        // warm up if not in cache yet
        imageCache.preloadOneLazy(src);
      }
      image.src = resolved;
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) return resolve('rgba(63, 188, 255, 0.35)');
          const sampleSize = 16;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          context.drawImage(image, 0, 0, sampleSize, sampleSize);
          const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha === 0) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          if (count === 0) return resolve('rgba(63, 188, 255, 0.35)');
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          resolve(`rgba(${r}, ${g}, ${b}, 0.45)`);
        } catch {
          resolve('rgba(63, 188, 255, 0.35)');
        }
      };
      image.onerror = () => resolve('rgba(63, 188, 255, 0.35)');
    });
  }, []);

  const computeAverageColorFromVideo = React.useCallback((videoEl: HTMLVideoElement | null): string => {
    if (!videoEl) return 'rgba(63, 188, 255, 0.35)';
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return 'rgba(63, 188, 255, 0.35)';
      const sampleSize = 16;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      context.drawImage(videoEl, 0, 0, sampleSize, sampleSize);
      const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (count === 0) return 'rgba(63, 188, 255, 0.35)';
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      return `rgba(${r}, ${g}, ${b}, 0.45)`;
    } catch {
      return 'rgba(63, 188, 255, 0.35)';
    }
  }, []);

  React.useEffect(() => {
    const slide = slides[currentIndex];
    let cancelled = false;
    if (!slide) return;
    if (slide.kind === 'text') {
      setShadowColor('rgba(63, 188, 255, 0.35)');
    } else if (slide.kind === 'image' && slide.image) {
      computeAverageColorFromImage(slide.image).then((color) => {
        if (!cancelled) setShadowColor(color);
      });
    } else if (slide.kind === 'video') {
      const attempt = () => {
        const color = computeAverageColorFromVideo(videoRef.current);
        setShadowColor(color);
      };
      // Try right away and also after short delay to allow first frames to render
      attempt();
      const t = setTimeout(attempt, 200);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    return () => { cancelled = true; };
  }, [currentIndex, slides, computeAverageColorFromImage, computeAverageColorFromVideo]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Always refresh cases on mount when online (lightweight server-side caching recommended)
  React.useEffect(() => {
    if (!isOnline) return;
    if (!isLoading) {
      loadCases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Refresh on tab visibility regain
  React.useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        if (isOnline && !isLoading) loadCases();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isOnline, isLoading, loadCases]);

  const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    const threshold = 40;
    const delta = touchDeltaXRef.current;
    if (Math.abs(delta) > threshold) {
      setCurrentIndex((prev) => {
        if (delta < 0) return (prev + 1) % slides.length;
        return (prev - 1 + slides.length) % slides.length;
      });
    }
    touchDeltaXRef.current = 0;
  }, [slides.length]);

  // Страница всегда рендерится; лоадер/ошибка отображаются внутри списка кейсов

  return (
    <div className={styles.homePage}>
      <Header />
      
      <div className={styles.casesContainer}>
        {/* Live status bar (hidden offline) */}
        {isOnline ? <LiveStatusBar /> : <div style={{ width: '100%', height: '20px' }}></div>}

        {/* Free case banners slider */}
        <div
          className={styles.freeCaseSlider}
          onTouchStart={(e) => { ConnectivityGuard.ensureOnline(); handleTouchStart(e); }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {slides[currentIndex]?.kind === 'text' ? (
            <div className={styles.freeCaseSlide} style={{ boxShadow: `0 0 20px ${shadowColor}` }}>
              <div className={styles.bannerContent}>
                <div className={styles.lightningIcon}>
                  <img src={ASSETS.IMAGES.LIGHTNING} alt="Lightning" />
                </div>
                <div className={styles.bannerText}>{slides[currentIndex]?.text}</div>
              </div>
              <Button size="sm" className={styles.telegramButton}>
                {t('messages.openCase')}
              </Button>
            </div>
          ) : slides[currentIndex]?.kind === 'image' ? (
            (() => {
              const slide = slides[currentIndex];
              const content = (
                <div className={`${styles.freeCaseSlide} ${styles.imageSlide}`} style={{ boxShadow: `0 0 20px ${shadowColor}` }}>
                  <ProgressiveImg className={styles.imageSlideImage} src={slide?.image || ''} alt="Slide" />
                </div>
              );
              return slide?.href ? (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.imageLink}
                >
                  {content}
                </a>
              ) : (
                content
              );
            })()
          ) : (
            (() => {
              const slide = slides[currentIndex];
              const videoEl = (
                <div className={`${styles.freeCaseSlide} ${styles.imageSlide}`} style={{ boxShadow: `0 0 20px ${shadowColor}` }}>
                  <video
                    ref={videoRef}
                    className={styles.imageSlideImage}
                    src={slide?.video || ''}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              );
              return slide?.href ? (
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.imageLink}
                >
                  {videoEl}
                </a>
              ) : (
                videoEl
              );
            })()
          )}
          {slides.length > 0 && (
            <div className={styles.freeCaseDots}>
              {[0, 1, 2].map((i) => {
                const baseIndex = Math.floor(currentIndex / 3) * 3;
                const idx = (baseIndex + i) % slides.length;
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={i}
                    className={`${styles.dot} ${isActive ? styles.dotActive : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                );
              })}
            </div>
          )}
        </div>
        {!isOnline && casesPhase === 'loading' && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>{t('home.loadingCases')}</div>
          </div>
        )}
        {!isOnline && casesPhase === 'error' && (
          <>
            {!hideCasesError && (
              <div className={styles.errorMessageContainer}>
                <div className={styles.errorMessageContent}>{t('common.offlineFeatures')}</div>
                <button className={styles.errorClose} onClick={() => setHideCasesError(true)}>×</button>
              </div>
            )}
            <div className={styles.errorState}>
              <div className={styles.errorMessage}>{t('common.failedToLoad')}</div>
              <button className={styles.retryButton} onClick={() => window.location.reload()}>
                <div className={styles.buttonLabel}>{t('common.tryAgain')}</div>
              </button>
            </div>
          </>
        )}
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
      
      {/* Компонент рулетки */}
      <RouletteWheel />
    </div>
  );
}; 