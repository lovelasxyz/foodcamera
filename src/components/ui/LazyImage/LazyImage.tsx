import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  rootMargin?: string;
  threshold?: number;
  style?: React.CSSProperties;
}

/**
 * Lazy loading image component with IntersectionObserver
 * Only loads image when it enters viewport
 * Automatically unloads when far from viewport to save memory
 *
 * Clean Architecture: Presentation Layer - UI Component
 * Single Responsibility: handles image lazy loading only
 *
 * @example
 * <LazyImage
 *   src="/images/prize.png"
 *   alt="Prize"
 *   placeholder="/images/placeholder.png"
 *   rootMargin="200px"
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  rootMargin = '400px',
  threshold = 0.01,
  style: customStyle
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Once image enters viewport, mark it as "seen" and keep it loaded
          if (entry.isIntersecting) {
            setHasBeenInView(true);
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Load image if it has ever been in viewport (don't unload after scroll)
  const shouldLoadImage = hasBeenInView;
  const imageSrc = shouldLoadImage ? src : (placeholder || undefined);

  // Don't render img if no src available (prevents empty string warning)
  if (!imageSrc) {
    return (
      <div
        ref={imgRef as any}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      style={{
        ...customStyle,
        filter: isLoaded && !hasError ? 'none' : 'blur(8px)',
        opacity: isLoaded && !hasError ? 1 : 0.6,
        transition: 'filter 0.3s ease, opacity 0.3s ease'
      }}
    />
  );
};
