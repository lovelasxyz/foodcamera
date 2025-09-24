import React from 'react';

interface ProgressiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  previewSrc?: string;
  cacheKey?: string; // для обратной совместимости
  lazy?: boolean; // по умолчанию true
}

export const ProgressiveImg: React.FC<ProgressiveImgProps> = ({ 
  previewSrc, 
  src,
  style,
  cacheKey, // игнорируется, но принимается для совместимости
  lazy = true,
  onLoad,
  ...rest 
}) => {
  const [loaded, setLoaded] = React.useState(false);
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

  const handleError = () => {
    // В случае ошибки убираем блюр/прозрачность, чтобы не прятать элемент
    setLoaded(true);
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
        src={src}
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