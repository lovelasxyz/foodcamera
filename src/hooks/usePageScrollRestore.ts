import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Restores scroll positions across route navigations (replaces logic in App.tsx)
export function usePageScrollRestore(containerSelector = '.app-container') {
  const location = useLocation();
  const routeKey = location.pathname || '/';
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const previousPageRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector) as HTMLElement | null;
    if (previousPageRef.current) {
      const prevKey = previousPageRef.current;
      const currentScroll = container ? container.scrollTop : window.scrollY;
      scrollPositionsRef.current[prevKey] = currentScroll;
    }
    const targetY = scrollPositionsRef.current[routeKey] ?? 0;
    if (container) {
      container.scrollTo({ top: targetY, behavior: 'auto' });
    } else {
      window.scrollTo({ top: targetY, behavior: 'auto' });
    }
    previousPageRef.current = routeKey;
  }, [routeKey, containerSelector]);
}
