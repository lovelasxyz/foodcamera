import React from 'react';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { useSlider, Slide } from '../hooks/useSlider';
import { useTouchSwipe } from '../hooks/useTouchSwipe';
import { SlideView } from '../SlideView';
import { useDominantColor } from '@/hooks/useDominantColor';
import styles from '../../HomePage.module.css';

interface BannerSliderProps {
  slides: Slide[];
  className?: string;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ slides, className }) => {
  const { currentIndex, currentSlide, nextSlide, prevSlide, goToSlide } = useSlider(slides);
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchSwipe(nextSlide, prevSlide);
  const [shadowColor, setShadowColor] = React.useState('rgba(85, 255, 153, 0.35)');

  // Получаем доминантный цвет из изображения
  const imageUrl = currentSlide?.kind === 'image' ? currentSlide.image : undefined;
  const { rgba } = useDominantColor(imageUrl);

  // Вычисление цвета тени
  React.useEffect(() => {
    if (currentSlide?.kind === 'text') {
      // Для текстовых слайдов используем зелёный цвет
      setShadowColor('rgba(85, 255, 153, 0.35)');
    } else if (currentSlide?.kind === 'image' && imageUrl) {
      // Для изображений используем вычисленный доминантный цвет
      const dominantColor = rgba(0.35);
      if (dominantColor !== 'rgba(0,0,0,0)') {
        setShadowColor(dominantColor);
      } else {
        // Fallback на зелёный если цвет не вычислен
        setShadowColor('rgba(85, 255, 153, 0.35)');
      }
    } else {
      // Для видео и других типов - зелёный
      setShadowColor('rgba(85, 255, 153, 0.35)');
    }
  }, [currentSlide, rgba, imageUrl]);

  if (!currentSlide) return null;

  return (
    <div
      className={`${styles.freeCaseSlider} ${className || ''}`}
      onTouchStart={(e) => {
        ConnectivityGuard.ensureOnline();
        handleTouchStart(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <SlideView slide={currentSlide} shadowColor={shadowColor} />

      {/* Invisible click zones on left/right to navigate */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className={styles.bannerHotspotLeft}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevSlide(); }}
          />
          <button
            type="button"
            aria-label="Next slide"
            className={styles.bannerHotspotRight}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextSlide(); }}
          />
        </>
      )}
      
      {slides.length > 1 && (
        <div className={styles.freeCaseDots}>
          {[0, 1, 2].map((i) => {
            const baseIndex = Math.floor(currentIndex / 3) * 3;
            const idx = (baseIndex + i) % slides.length;
            const isActive = idx === currentIndex;
            return (
              <div
                key={i}
                className={`${styles.dot} ${isActive ? styles.dotActive : ''}`}
                onClick={() => goToSlide(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};



