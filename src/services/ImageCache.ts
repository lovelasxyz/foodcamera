// Lightweight image preloading and cache signaling utility
// - Deduplicates in-flight requests
// - Marks images as loaded for instant render in ProgressiveImg

type PreloadOptions = {
	concurrency?: number;
	priority?: 'high' | 'normal' | 'low';
};

class ImageCacheService {
	private loadedUrls: Set<string> = new Set();
	private inFlight: Map<string, Promise<void>> = new Map();
	private objectUrls: Map<string, string> = new Map();
	private subscribers: Map<string, Set<() => void>> = new Map();
	// Maintain LRU order: most recently used keys at the end
	private lruList: string[] = [];
	private capacity: number;

	constructor(capacity = 80) {
		this.capacity = capacity;
	}

	isLoaded(url: string | undefined | null): boolean {
		if (!url) return false;
		return this.loadedUrls.has(url) || this.objectUrls.has(url);
	}

	markLoaded(url: string | undefined | null): void {
		if (!url) return;
		this.loadedUrls.add(url);
		this.touchKey(url);
	}

	preload(urls: Array<string | undefined | null>, options: PreloadOptions = {}): Promise<void> {
		const unique = Array.from(new Set(urls.filter((u): u is string => !!u)));
		if (unique.length === 0) return Promise.resolve();

		const concurrency = Math.max(1, Math.min(options.concurrency ?? this.getRecommendedConcurrency(), 6));
		let index = 0;

		const worker = async () => {
			while (index < unique.length) {
				const current = unique[index++];
				if (this.loadedUrls.has(current)) continue;
				await this.preloadOne(current);
			}
		};

		const workers = Array.from({ length: Math.min(concurrency, unique.length) }, () => worker());
		return Promise.all(workers).then(() => void 0);
	}

	private preloadOne(url: string): Promise<void> {
		if (this.loadedUrls.has(url)) return Promise.resolve();
		const existing = this.inFlight.get(url);
		if (existing) return existing;

		const p = (async () => {
			try {
				const resp = await fetch(url, { mode: 'cors' });
				if (!resp.ok) throw new Error('Network response not ok');
				const blob = await resp.blob();
				const objectUrl = URL.createObjectURL(blob);
				this.objectUrls.set(url, objectUrl);
				this.loadedUrls.add(url);
				this.touchKey(url);
				this.inFlight.delete(url);
				this.notifySubscribers(url);
			} catch (e) {
				// Fallback: try to mark as loaded so components can continue using original URL
				this.inFlight.delete(url);
				this.loadedUrls.add(url);
			}
		})();

		this.inFlight.set(url, p);
		return p;
	}

	// Public API to lazy preload a single image (non-blocking)
	preloadOneLazy(url: string) {
		if (!url) return;
		if (this.objectUrls.has(url) || this.loadedUrls.has(url)) return;
		this.preloadOne(url).catch(() => {});
	}

	getCachedSrc(url: string): string {
		const obj = this.objectUrls.get(url);
		if (obj) {
			this.touchKey(url);
			return obj;
		}
		return url;
	}

	private touchKey(url: string) {
		const idx = this.lruList.indexOf(url);
		if (idx !== -1) this.lruList.splice(idx, 1);
		this.lruList.push(url);
		this.evictIfNeeded();
	}

	private evictIfNeeded() {
		while (this.lruList.length > this.capacity) {
			const oldest = this.lruList.shift();
			if (!oldest) continue;
			const obj = this.objectUrls.get(oldest);
			if (obj) {
				URL.revokeObjectURL(obj);
				this.objectUrls.delete(oldest);
			}
			this.loadedUrls.delete(oldest);
			this.inFlight.delete(oldest);
			this.subscribers.delete(oldest);
		}
	}

	subscribe(url: string, cb: () => void): () => void {
		if (!this.subscribers.has(url)) this.subscribers.set(url, new Set());
		this.subscribers.get(url)!.add(cb);
		return () => this.unsubscribe(url, cb);
	}

	unsubscribe(url: string, cb: () => void) {
		const s = this.subscribers.get(url);
		if (!s) return;
		s.delete(cb);
		if (s.size === 0) this.subscribers.delete(url);
	}

	private notifySubscribers(url: string) {
		const s = this.subscribers.get(url);
		if (!s) return;
		for (const cb of Array.from(s)) cb();
	}

	// Optional cleanup if needed
	revoke(url: string) {
		const obj = this.objectUrls.get(url);
		if (obj) {
			URL.revokeObjectURL(obj);
			this.objectUrls.delete(url);
			const idx = this.lruList.indexOf(url);
			if (idx !== -1) this.lruList.splice(idx, 1);
		}
	}

	private getRecommendedConcurrency(): number {
		try {
			const anyNav: any = navigator as any;
			const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection;
			const downlink: number = connection?.downlink ?? 10;
			// Conservative defaults for low/mid tier
			if (downlink < 1.5) return 2;
			if (downlink < 3) return 3;
			return 4;
		} catch {
			return 3;
		}
	}
}

export const imageCache = new ImageCacheService();



