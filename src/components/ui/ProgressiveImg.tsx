import React from 'react';
import { imageCache } from '@/services/ImageCache';

interface ProgressiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  previewSrc?: string;
  cacheKey?: string; // optional external version to invalidate local blur cache
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
    if (downlink < 1.5 || memory < 2) return '50px';  // Загружаем только когда очень близко
    if (downlink < 3 || memory < 4) return '100px';   // Средняя дистанция
    return '200px';                                    // Агрессивная предзагрузка для мощных устройств
  } catch {
    return '100px'; // Безопасное значение по умолчанию
  }
}

export const ProgressiveImg: React.FC<ProgressiveImgProps> = ({ previewSrc, src, cacheKey, style, ...rest }) => {
  const srcStr = typeof src === 'string' ? src : undefined;
  const cacheId = srcStr ? `${srcStr}${cacheKey ? `?v=${cacheKey}` : ''}` : '';
  const initialLoaded = cacheId ? (loadedCache.has(cacheId) || imageCache.isLoaded(srcStr)) : false;
  const [loaded, setLoaded] = React.useState(initialLoaded);
  const [error, setError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(() => (srcStr ? imageCache.getCachedSrc(srcStr) : undefined));
  const mountedRef = React.useRef(true);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // Отключаем blur на слабых устройствах для экономии ресурсов
  const shouldUseBlur = React.useMemo(() => {
    try {
      const anyNav: any = navigator as any;
      const memory = (anyNav as any)?.deviceMemory ?? 4;
      return memory >= 2; // Используем blur только на устройствах с 2GB+ RAM
    } catch {
      return true; // По умолчанию включаем blur
    }
  }, []);

  const finalStyle: React.CSSProperties = {
    ...style,
    filter: loaded ? 'none' : (shouldUseBlur ? 'blur(12px) saturate(0.8)' : 'opacity(0.7)'),
    transition: shouldUseBlur ? 'filter 300ms ease' : 'opacity 300ms ease',
  };

  React.useEffect(() => {
    mountedRef.current = true;
    if (!srcStr) return;
    // If already cached as object URL, use it immediately
    const cached = imageCache.getCachedSrc(srcStr);
    if (cached && cached !== srcStr) {
      setCurrentSrc(cached);
      setLoaded(true);
      return;
    }

    // Quick synchronous check whether the browser already has the image cached
    try {
      const testImg = new Image();
      testImg.src = srcStr;
      if (testImg.complete) {
        // Browser cache hit — avoid flicker
        setCurrentSrc(srcStr);
        setLoaded(true);
        return;
      }
    } catch {
      // ignore
    }

    // Subscribe to cache updates so when preload finishes we switch to object URL
    const unsub = imageCache.subscribe(srcStr, () => {
      if (!mountedRef.current) return;
      const updated = imageCache.getCachedSrc(srcStr);
      setCurrentSrc(updated);
      setLoaded(true);
    });

  // Lazy-load when element becomes visible
    let observer: IntersectionObserver | null = null;
    const el = imgRef.current;
    if (el && 'IntersectionObserver' in window) {
      // Адаптивный rootMargin в зависимости от производительности устройства
      const rootMargin = getOptimalRootMargin();
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            imageCache.preloadOneLazy(srcStr);
            observer?.unobserve(entry.target);
          }
        }
      }, { rootMargin });
      observer.observe(el);
    } else if (el) {
      // No observer support: preload immediately
      imageCache.preloadOneLazy(srcStr);
    }

    return () => {
      mountedRef.current = false;
      unsub();
      if (observer && imgRef.current) observer.unobserve(imgRef.current);
    };
  }, [srcStr]);

  React.useEffect(() => {
    // Keep loaded state in sync if parent passes a different src
    if (!srcStr) return;
    if (imageCache.isLoaded(srcStr)) setLoaded(true);
  }, [srcStr]);

  return (
    <>
      {previewSrc && !loaded && !error && (
        <img src={previewSrc} style={{ ...finalStyle, position: 'absolute' }} aria-hidden />
      )}
      <img
        {...rest}
        ref={imgRef}
        src={currentSrc || src}
        loading={(rest as any).loading ?? 'lazy'}
        decoding={(rest as any).decoding ?? 'async'}
        style={finalStyle}
        onLoad={() => {
          if (cacheId) loadedCache.add(cacheId);
          if (typeof src === 'string') imageCache.markLoaded(src);
          setLoaded(true);
          // touch LRU
          if (typeof src === 'string') imageCache.getCachedSrc(src);
        }}
        onError={() => setError(true)}
      />
    </>
  );
};


