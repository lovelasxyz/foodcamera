import React from 'react';

/**
 * Locks body scroll without moving the page to the top.
 * Applies a single `scroll-lock` class to the body and uses a CSS var for the offset.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const scrollRef = React.useRef<number>(0);

  React.useEffect(() => {
    const body = document.body;
    if (isLocked) {
      scrollRef.current = window.scrollY || window.pageYOffset || 0;
      body.style.setProperty('--scroll-lock-top', `-${scrollRef.current}px`);
      body.classList.add('scroll-lock');
      return () => {
        // Cleanup when unmount/dep change while locked
        body.classList.remove('scroll-lock');
        body.style.removeProperty('--scroll-lock-top');
        window.scrollTo(0, scrollRef.current);
      };
    }

    // If not locked, ensure class/var are removed (idempotent)
    body.classList.remove('scroll-lock');
    body.style.removeProperty('--scroll-lock-top');
    return undefined;
  }, [isLocked]);
}


