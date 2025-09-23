import React from 'react';

export function useTouchSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 40) {
  const touchStartX = React.useRef(0);
  const touchDelta = React.useRef(0);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    const delta = touchDelta.current;
    if (Math.abs(delta) > threshold) {
      if (delta < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
    touchDelta.current = 0;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}



