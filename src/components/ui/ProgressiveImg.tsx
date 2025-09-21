import React from 'react';
import { imageCache } from '@/services/ImageCache';

interface ProgressiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  previewSrc?: string;
}

export const ProgressiveImg: React.FC<ProgressiveImgProps> = ({ 
  previewSrc, 
  src, 
  style, 
  ...rest 
}) => {
  const srcStr = typeof src === 'string' ? src : undefined;
  const [loaded, setLoaded] = React.useState(() => srcStr ? imageCache.isLoaded(srcStr) : false);
  const [error, setError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Простая проверка производительности устройства
  const shouldBlur = React.useMemo(() => {
    try {
      return ((navigator as any)?.deviceMemory ?? 4) >= 2;
    } catch {
      return true;
    }
  }, []);

  // Эффект для управления загрузкой
  React.useEffect(() => {
    if (!srcStr) {
      setLoaded(false);
      setError(false);
      return;
    }

    // Быстрая проверка кеша
    if (imageCache.isLoaded(srcStr)) {
      setLoaded(true);
      setError(false);
      return;
    }

    // Подписываемся на загрузку
    const unsubscribe = imageCache.subscribe(srcStr, () => {
      setLoaded(true);
      setError(false);
    });

    // Lazy loading с IntersectionObserver
    const img = imgRef.current;
    if (img && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            imageCache.preloadLazy(srcStr);
            observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      );
      observer.observe(img);
      
      return () => {
        unsubscribe();
        observer.disconnect();
      };
    } else {
      // Fallback - загружаем сразу
      imageCache.preloadLazy(srcStr);
    }

    return unsubscribe;
  }, [srcStr]);

  const handleLoad = React.useCallback(() => {
    if (srcStr) {
      imageCache.markLoaded(srcStr);
    }
    setLoaded(true);
    setError(false);
  }, [srcStr]);

  const handleError = React.useCallback(() => {
    setError(true);
    setLoaded(false);
  }, []);

  const imageStyle: React.CSSProperties = {
    ...style,
    filter: loaded ? 'none' : (shouldBlur ? 'blur(8px)' : 'opacity(0.5)'),
    transition: 'filter 0.3s ease, opacity 0.3s ease',
  };

  return (
    <>
      {previewSrc && !loaded && !error && (
        <img 
          src={previewSrc} 
          style={{ ...imageStyle, position: 'absolute' }} 
          aria-hidden 
          alt=""
        />
      )}
      <img
        {...rest}
        ref={imgRef}
        src={src}
        loading="lazy"
        decoding="async"
        style={imageStyle}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
};