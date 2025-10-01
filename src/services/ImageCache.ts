/**
 * Simple image preloader with concurrency control
 * Uses browser's native image caching
 */
class ImagePreloader {
  private loading = new Set<string>();
  private loaded = new Set<string>();

  isLoaded(url: string): boolean {
    return this.loaded.has(url);
  }

  async preload(urls: string[], options: { concurrency?: number } = {}): Promise<void> {
    const { concurrency = 3 } = options;
    const toLoad = urls.filter(url => url && !this.loaded.has(url) && !this.loading.has(url));

    if (toLoad.length === 0) return;

    // Load images in batches with concurrency limit
    const batches: string[][] = [];
    for (let i = 0; i < toLoad.length; i += concurrency) {
      batches.push(toLoad.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      await Promise.allSettled(batch.map(url => this.loadSingle(url)));
    }
  }

  private loadSingle(url: string): Promise<void> {
    if (this.loading.has(url) || this.loaded.has(url)) {
      return Promise.resolve();
    }

    this.loading.add(url);

    return new Promise((resolve) => {
      const img = new Image();

      const cleanup = () => {
        this.loading.delete(url);
        this.loaded.add(url);
        resolve();
      };

      img.onload = cleanup;
      img.onerror = cleanup; // Mark as loaded even on error to avoid retries

      img.src = url;
    });
  }

  getCachedSrc(url: string): string {
    return url; // Browser handles caching
  }
}

export const imageCache = new ImagePreloader();

// Helper functions
export const preloadCaseImages = (cases: Array<{ image: string }>) => {
  const images = cases.map(c => c.image).filter(Boolean);
  if (images.length > 0) {
    imageCache.preload(images, { concurrency: 3 });
  }
};

export const preloadBannerAssets = (assets: string[]) => {
  imageCache.preload(assets, { concurrency: 3 });
};
