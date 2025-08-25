import React from 'react';
import { useCasesStore } from '@/store/casesStore';
import { Header } from '@/components/layout/Header';
import { LiveStatusBar } from '@/components/layout/LiveStatusBar';
import { CaseCard } from '@/components/game/CaseCard';
import { RouletteWheel } from '@/components/game/RouletteWheel';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ASSETS } from '@/constants/assets';
import { MESSAGES } from '@/utils/constants';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const { cases, isLoading } = useCasesStore();

  const touchStartXRef = React.useRef<number>(0);
  const touchDeltaXRef = React.useRef<number>(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [shadowColor, setShadowColor] = React.useState<string>('rgba(63, 188, 255, 0.35)');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  type Slide = { kind: 'text' | 'image' | 'video'; text?: string; image?: string; video?: string; href?: string };
  const slides = React.useMemo<Slide[]>(
    () => [
      { kind: 'text', text: MESSAGES.FREE_BANNER_1 },
      //{ kind: 'image', image: ASSETS.IMAGES.DRAGON, href: 'https://t.me/BotFather' },
    //  { kind: 'text', text: MESSAGES.FREE_BANNER_2 },
    //  { kind: 'video', video: ASSETS.VIDEOS.DARKSIDE, href: 'https://t.me/BotFather' },
    //  { kind: 'text', text: MESSAGES.FREE_BANNER_3 },
      //{ kind: 'image', image: ASSETS.IMAGES.DIAMOND, href: 'https://t.me/BotFather' },
     // { kind: 'text', text: MESSAGES.FREE_BANNER_4 },
      //{ kind: 'image', image: ASSETS.IMAGES.GIFT },
    //  { kind: 'text', text: MESSAGES.FREE_BANNER_5 },
     // { kind: 'image', image: ASSETS.IMAGES.TEDDY, href: 'https://t.me/BotFather' },
      { kind: 'text', text: MESSAGES.FREE_BANNER_6 },
      { kind: 'text', text: MESSAGES.FREE_BANNER_7 },
    ],
    []
  );

  const computeAverageColorFromImage = React.useCallback((src: string): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = src;
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
    }, 12000);
    return () => clearInterval(interval);
  }, [slides.length]);

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

  if (isLoading) {
    return (
      <div className={styles.homePage}>
        <Header />
        <div className={styles.loading}>
          <Loader text={MESSAGES.LOADING_CASES} size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.homePage}>
      <Header />
      
      <div className={styles.casesContainer}>
        {/* Live status bar */}
        <LiveStatusBar />

        {/* Free case banners slider */}
        <div
          className={styles.freeCaseSlider}
          onTouchStart={handleTouchStart}
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
                {MESSAGES.OPEN_CASE}
              </Button>
            </div>
          ) : slides[currentIndex]?.kind === 'image' ? (
            (() => {
              const slide = slides[currentIndex];
              const content = (
                <div className={`${styles.freeCaseSlide} ${styles.imageSlide}`} style={{ boxShadow: `0 0 20px ${shadowColor}` }}>
                  <img className={styles.imageSlideImage} src={slide?.image || ''} alt="Slide" />
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
          <div className={styles.freeCaseDots}>
            {slides.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        </div>
        
        {/* Сетка кейсов */}
        <div className={styles.casesGrid}>
          {cases.length > 0 ? (
            cases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseData={caseItem} />
            ))
          ) : (
            <div className={styles.noCases}>
              <Loader text={MESSAGES.LOADING_CASES} size="md" />
            </div>
          )}
        </div>
      </div>
      
      {/* Компонент рулетки */}
      <RouletteWheel />
    </div>
  );
}; 