import React from 'react';
import { imageCache } from '@/services/ImageCache';

export function useImagePreload() {
  const preloadBannerAssets = React.useCallback((assets: string[]) => {
    imageCache.preload(assets, {  concurrency: 3 });
  }, []);

  const preloadCaseImages = React.useCallback((cases: Array<{ image: string }>) => {
    if (cases.length > 0) {
      const caseImages = cases.slice(0, 8).map(c => c.image); // Первые 8 кейсов
      imageCache.preload(caseImages, {  concurrency: 2 });
    }
  }, []);

  return {
    preloadBannerAssets,
    preloadCaseImages
  };
}



