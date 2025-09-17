import React from 'react';
import { imageCache } from '@/services/ImageCache';

interface ProgressiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  previewSrc?: string;
  cacheKey?: string; // optional external version to invalidate local blur cache
}

const loadedCache = new Set<string>();

export const ProgressiveImg: React.FC<ProgressiveImgProps> = ({ previewSrc, src, cacheKey, style, ...rest }) => {
  const srcStr = typeof src === 'string' ? src : undefined;
  const cacheId = srcStr ? `${srcStr}${cacheKey ? `?v=${cacheKey}` : ''}` : '';
  const initialLoaded = cacheId ? (loadedCache.has(cacheId) || imageCache.isLoaded(srcStr)) : false;
  const [loaded, setLoaded] = React.useState(initialLoaded);
  const [error, setError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState<string | undefined>(() => (srcStr ? imageCache.getCachedSrc(srcStr) : undefined));
  const mountedRef = React.useRef(true);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const finalStyle: React.CSSProperties = {
    ...style,
    filter: loaded ? 'none' : 'blur(12px) saturate(0.8)',
    transition: 'filter 300ms ease',
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
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            imageCache.preloadOneLazy(srcStr);
            observer?.unobserve(entry.target);
          }
        }
      }, { rootMargin: '200px' });
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


