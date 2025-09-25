import React from 'react';

interface ProgressiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  previewSrc?: string;
  cacheKey?: string; // для обратной совместимости
  lazy?: boolean; // по умолчанию true
  fallbackSrc?: string; // на случай ошибки
}

export const ProgressiveImg: React.FC<ProgressiveImgProps> = ({ 
  previewSrc, 
  src,
  style,
  cacheKey: _cacheKey, // игнорируется, но принимается для совместимости
  lazy = true,
  fallbackSrc,
  onLoad,
  onError,
  ...rest 
}) => {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  // Сброс loaded при смене src и учет кэшированных изображений
  React.useEffect(() => {
    setLoaded(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      // Изображение уже в кэше и загружено — сразу показываем
      setLoaded(true);
    }
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setFailed(true);
    setLoaded(true);
    if (fallbackSrc && imgRef.current && imgRef.current.src !== fallbackSrc) {
      imgRef.current.src = fallbackSrc;
      return; // повторная попытка отображения fallback
    }
    onError?.(e);
  };

  return (
    <>
      {previewSrc && !loaded && (
        <img 
          src={previewSrc} 
          style={{ 
            ...style, 
            position: 'absolute',
            filter: 'blur(8px)',
            opacity: 0.5
          }} 
          aria-hidden="true"
          alt=""
        />
      )}
      <img
        {...rest}
        src={failed && fallbackSrc ? fallbackSrc : src}
        ref={imgRef}
        style={{
          ...style,
          filter: loaded ? 'none' : 'blur(8px)',
          opacity: loaded ? 1 : 0,
          transition: 'filter 0.3s ease, opacity 0.3s ease',
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
      />
    </>
  );
};

// Упрощённый wrapper для безопасной отрисовки (можно использовать напрямую, если нужны значения по умолчанию)
export const SafeImg: React.FC<Omit<ProgressiveImgProps, 'previewSrc'>> = (props) => {
  return (
    <ProgressiveImg
      {...props}
      lazy={props.lazy ?? true}
      fallbackSrc={props.fallbackSrc || '/assets/images/loader.png'}
    />
  );
};