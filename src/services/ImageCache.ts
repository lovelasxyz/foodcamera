// Lightweight image preloading and cache signaling utility
// - Deduplicates in-flight requests
// - Marks images as loaded for instant render in ProgressiveImg

type PreloadOptions = {
	concurrency?: number;
	priority?: 'high' | 'normal' | 'low';
	// When true, re-fetch even if URL was previously loaded/cached
	force?: boolean;
};

// Определяет оптимальную емкость кэша на основе производительности устройства
function getOptimalCacheCapacity(): number {
	try {
		const anyNav: any = navigator as any;
		const memory = (anyNav as any)?.deviceMemory ?? 4;
		const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection;
		const downlink: number = connection?.downlink ?? 10;
		
		// Очень консервативные настройки для слабых устройств
		if (memory < 2 || downlink < 1.5) return 20;  // Минимальный кэш для очень слабых устройств
		if (memory < 4 || downlink < 3) return 40;    // Средний кэш
		return 80;                                     // Полный кэш для мощных устройств
	} catch {
		return 40; // Безопасное значение по умолчанию
	}
}

class ImageCacheService {
	private loadedUrls: Set<string> = new Set();
	private inFlight: Map<string, Promise<void>> = new Map();
	private objectUrls: Map<string, string> = new Map();
	private subscribers: Map<string, Set<() => void>> = new Map();
	// Maintain LRU order: most recently used keys at the end
	private lruList: string[] = [];
	private capacity: number;

	constructor(capacity = getOptimalCacheCapacity()) {
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
				if (!options.force && this.loadedUrls.has(current)) continue;
				await this.preloadOne(current, options.force === true);
			}
		};

		const workers = Array.from({ length: Math.min(concurrency, unique.length) }, () => worker());
		return Promise.all(workers).then(() => void 0);
	}

	private preloadOne(url: string, force = false): Promise<void> {
		if (!force && this.loadedUrls.has(url)) return Promise.resolve();
		const existing = this.inFlight.get(url);
		if (existing) return existing;

		if (force) {
			const oldObj = this.objectUrls.get(url);
			if (oldObj) {
				URL.revokeObjectURL(oldObj);
				this.objectUrls.delete(url);
			}
			this.loadedUrls.delete(url);
		}

		const p = (async () => {
			try {
				const resp = await fetch(url, { mode: 'cors', cache: force ? 'reload' : 'force-cache' });
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

// Оптимизированная функция для предзагрузки изображений кейсов
export function preloadCaseImages(cases: any[], options: { priorityCount?: number; concurrency?: number } = {}): void {
	const allImages: string[] = [];
	
	// Собираем все изображения
	for (const caseItem of cases) {
		if (caseItem.image) allImages.push(caseItem.image);
		// Не предзагружаем изображения призов сразу - они загрузятся при открытии кейса
	}
	
	const uniqueImages = Array.from(new Set(allImages.filter(Boolean)));
	if (uniqueImages.length === 0) return;
	
	// Определяем параметры на основе производительности устройства
	const concurrency = options.concurrency ?? getOptimalConcurrency();
	const priorityCount = options.priorityCount ?? 8; // Загружаем только первые 8 кейсов сразу
	
	// Предзагружаем приоритетные изображения (видимые на экране)
	const priorityImages = uniqueImages.slice(0, priorityCount);
	const remainingImages = uniqueImages.slice(priorityCount);
	
	// Загружаем приоритетные сразу
	if (priorityImages.length > 0) {
		imageCache.preload(priorityImages, { concurrency }).catch(() => {});
	}
	
	// Остальные загружаем с задержкой для слабых устройств
	if (remainingImages.length > 0) {
		const delay = getOptimalDelay();
		setTimeout(() => {
			imageCache.preload(remainingImages, { concurrency: Math.max(1, concurrency - 1) }).catch(() => {});
		}, delay);
	}
}

// Определяет оптимальный concurrency на основе производительности устройства
function getOptimalConcurrency(): number {
	try {
		const anyNav: any = navigator as any;
		const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection;
		const downlink: number = connection?.downlink ?? 10;
		const memory = (anyNav as any)?.deviceMemory ?? 4;
		
		// Очень консервативные настройки для слабых устройств
		if (downlink < 1.5 || memory < 2) return 1;
		if (downlink < 3 || memory < 4) return 2;
		return 3;
	} catch {
		return 2; // Безопасное значение по умолчанию
	}
}

// Определяет задержку для загрузки неприоритетных изображений
function getOptimalDelay(): number {
	try {
		const anyNav: any = navigator as any;
		const connection = anyNav?.connection || anyNav?.mozConnection || anyNav?.webkitConnection;
		const downlink: number = connection?.downlink ?? 10;
		
		if (downlink < 1.5) return 3000; // 3 секунды для медленных соединений
		if (downlink < 3) return 1500;   // 1.5 секунды для средних
		return 500;                      // 0.5 секунды для быстрых
	} catch {
		return 2000; // Безопасное значение по умолчанию
	}
}



