export function runIdle(callback: () => void): (() => void) | undefined {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = (window as any).requestIdleCallback(callback);
    return () => {
      try {
        (window as any).cancelIdleCallback?.(id);
      } catch {
        // no-op
      }
    };
  }
  const id = setTimeout(callback, 0);
  return () => clearTimeout(id);
}
