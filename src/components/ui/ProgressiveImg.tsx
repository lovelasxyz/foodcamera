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

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  // Сброс loaded при смене src
  React.useEffect(() => {
    setLoaded(false);
  }, [src]);

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
        style={{
          ...style,
          filter: loaded ? 'none' : 'blur(8px)',
          opacity: loaded ? 1 : 0,
          transition: 'filter 0.3s ease, opacity 0.3s ease',
        }}
        onLoad={handleLoad}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
      />
    </>
  );
};