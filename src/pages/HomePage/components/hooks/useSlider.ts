import React from 'react';

export interface Slide {
  readonly kind: 'text' | 'image' | 'video';
  readonly text?: string;
  readonly image?: string;
  readonly video?: string;
  readonly href?: string;
}

export function useSlider(slides: Slide[], autoplayInterval = 8000) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = React.useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = React.useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  }, [slides.length]);

  // Автопроигрывание
  React.useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(nextSlide, autoplayInterval);
    return () => clearInterval(interval);
  }, [slides.length, autoplayInterval, nextSlide]);

  return {
    currentIndex,
    currentSlide: slides[currentIndex],
    nextSlide,
    prevSlide,
    goToSlide
  };
}



