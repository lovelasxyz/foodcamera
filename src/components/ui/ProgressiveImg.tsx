import React from 'react';
import { imageCache } from '@/services/ImageCache';

interface ProgressiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  previewSrc?: string;
  cacheKey?: string;
}

const loadedCache = new Set<string>();

// Определяет оптимальный rootMargin для IntersectionObserver на основе производительности устройства
function getOptimalRootMargin(): string {
  try {
    const anyNav: any = navigator as any;
    const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection;
    const downlink: number = connection?.downlink ?? 10;
    const memory = (anyNav as any)?.deviceMemory ?? 4;
    
    // Более консервативные настройки для слабых устройств
    if (downlink < 1.5 || memory < 2) return '50px';
    if (downlink < 3 || memory < 4) return '100px';
    return '200px';
  } catch {
    return '100px';
  }
}

export const ProgressiveImg: React.FC<ProgressiveImgProps> = ({ previewSrc, src, cacheKey, style, ...rest }) => {
  const srcStr = typeof src === 'string' ? src : undefined;
  const cacheId = srcStr ? `${srcStr}${cacheKey ? `?v=${cacheKey}` : ''}` : '';
  
  // Простая проверка начального состояния
  const isInitiallyLoaded = React.useMemo(() => {
    if (!srcStr) return false;
    return (cacheId && loadedCache.has(cacheId)) || imageCache.isLoaded(srcStr);
  }, [srcStr, cacheId]);

  const [loaded, setLoaded] = React.useState(isInitiallyLoaded);
  const [error, setError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // Отключаем blur на слабых устройствах для экономии ресурсов
  const shouldUseBlur = React.useMemo(() => {
    try {
      const anyNav: any = navigator as any;
      const memory = (anyNav as any)?.deviceMemory ?? 4;
      return memory >= 2;
    } catch {
      return true;
    }
  }, []);

  const finalStyle: React.CSSProperties = {
    ...style,
    filter: loaded ? 'none' : (shouldUseBlur ? 'blur(12px) saturate(0.8)' : 'opacity(0.7)'),
    transition: shouldUseBlur ? 'filter 300ms ease' : 'opacity 300ms ease',
  };

  // Единый эффект для управления lazy loading
  React.useEffect(() => {
    if (!srcStr || loaded) return;

    const img = imgRef.current;
    if (!img) return;

    // Подписка на обновления кэша
    const unsubscribe = imageCache.subscribe(srcStr, () => {
      setLoaded(true);
      if (cacheId) loadedCache.add(cacheId);
    });

    // Настройка IntersectionObserver
    let observer: IntersectionObserver | null = null;
    
    if ('IntersectionObserver' in window) {
      const rootMargin = getOptimalRootMargin();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              imageCache.preloadOneLazy(srcStr);
              observer?.unobserve(entry.target);
            }
          }
        },
        { rootMargin }
      );
      observer.observe(img);
    } else {
      // Fallback для старых браузеров
      imageCache.preloadOneLazy(srcStr);
    }

    return () => {
      unsubscribe();
      if (observer && img) {
        observer.unobserve(img);
      }
    };
  }, [srcStr, loaded, cacheId]);

  // Сброс состояния при изменении src
  React.useEffect(() => {
    if (!srcStr) {
      setLoaded(false);
      setError(false);
      return;
    }

    const newLoaded = (cacheId && loadedCache.has(cacheId)) || imageCache.isLoaded(srcStr);
    setLoaded(newLoaded);
    setError(false);
  }, [srcStr, cacheId]);

  const currentSrc = srcStr ? imageCache.getCachedSrc(srcStr) : src;

  return (
    <>
      {previewSrc && !loaded && !error && (
        <img 
          src={previewSrc} 
          style={{ ...finalStyle, position: 'absolute' }} 
          aria-hidden 
        />
      )}
      <img
        {...rest}
        ref={imgRef}
        src={currentSrc}
        loading="lazy"
        decoding="async"
        style={finalStyle}
        onLoad={() => {
          setLoaded(true);
          setError(false);
          if (cacheId) loadedCache.add(cacheId);
          if (srcStr) imageCache.markLoaded(srcStr);
        }}
        onError={() => setError(true)}
      />
    </>
  );
};