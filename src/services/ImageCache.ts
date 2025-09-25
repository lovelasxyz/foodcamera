// Улучшенный image cache без проблем с производительностью

interface PreloadOptions {
	concurrency?: number;
	force?: boolean;
	priority?: 'high' | 'low';
  }
  
  class SimpleImageCache {
	private loaded = new Set<string>();
	private loading = new Map<string, Promise<void>>();
	private failed = new Set<string>();
	private subscribers = new Map<string, Set<() => void>>();
	private loadQueue: string[] = [];
	private activeLoads = 0;
	private maxConcurrent = 3;
	private retryCounts = new Map<string, number>();
	private maxRetries = 2; // 2 дополнительных попытки после первой
  
	isLoaded(url: string): boolean {
	  if (!url) return false;
	  // Проверяем также браузерный кеш через Performance API
	  if (this.loaded.has(url)) return true;
	  
	  // Дополнительная проверка через браузерный кеш
	  if (typeof performance !== 'undefined' && performance.getEntriesByName) {
		const entries = performance.getEntriesByName(url);
		if (entries.length > 0) {
		  this.loaded.add(url);
		  return true;
		}
	  }
	  
	  return false;
	}
  
	isLoading(url: string): boolean {
	  return this.loading.has(url);
	}
  
	hasFailed(url: string): boolean {
	  return this.failed.has(url);
	}
  
	markLoaded(url: string): void {
	  if (!url) return;
	  this.loaded.add(url);
	  this.loading.delete(url);
	  this.failed.delete(url);
	  this.notify(url);
	  this.processQueue();
	}
  
	markFailed(url: string): void {
	  if (!url) return;
	  const current = this.retryCounts.get(url) || 0;
	  if (current < this.maxRetries) {
		this.retryCounts.set(url, current + 1);
		// повторно запланируем в начало очереди (быстрая повторная попытка)
		if (!this.loadQueue.includes(url)) {
		  this.loadQueue.unshift(url);
		}
		this.loading.delete(url);
		this.activeLoads--;
		this.processQueue();
		return;
	  }
	  this.failed.add(url);
	  this.loading.delete(url);
	  this.activeLoads--;
	  this.processQueue();
	}
  
	async preload(urls: string[], options: PreloadOptions = {}): Promise<void> {
	  const { concurrency = 3, force = false, priority = 'low' } = options;
	  const validUrls = urls.filter(url => url && (force || !this.isLoaded(url)));
	  
	  if (validUrls.length === 0) return;
  
	  // Высокий приоритет - загружаем сразу
	  if (priority === 'high') {
		const promises = validUrls.map(url => this.loadSingle(url, true));
		await Promise.allSettled(promises);
		return;
	  }
  
	  // Низкий приоритет - добавляем в очередь
	  this.maxConcurrent = concurrency;
	  validUrls.forEach(url => {
		if (!this.loadQueue.includes(url) && !this.loading.has(url)) {
		  this.loadQueue.push(url);
		}
	  });
	  
	  this.processQueue();
	}
  
	preloadLazy(url: string): void {
	  if (!url || this.isLoaded(url) || this.isLoading(url)) return;
	  
	  // Добавляем в начало очереди для более быстрой загрузки
	  if (!this.loadQueue.includes(url)) {
		this.loadQueue.unshift(url);
		this.processQueue();
	  }
	}
  
	private processQueue(): void {
	  while (this.activeLoads < this.maxConcurrent && this.loadQueue.length > 0) {
		const url = this.loadQueue.shift();
		if (url && !this.isLoaded(url) && !this.isLoading(url)) {
		  this.loadSingle(url, false);
		}
	  }
	}
  
	private async loadSingle(url: string, highPriority: boolean = false): Promise<void> {
	  if (!url || this.loading.has(url)) {
		return this.loading.get(url);
	  }
	  
	  if (this.isLoaded(url)) {
		return Promise.resolve();
	  }
  
	  this.activeLoads++;
	  this.failed.delete(url);
  
	  const loadPromise = new Promise<void>((resolve, reject) => {
		const img = new Image();
		
		// Настройки для избежания проблем с CORS
		img.crossOrigin = 'anonymous';
		
		// Таймаут для предотвращения зависания
		const timeout = setTimeout(() => {
		  img.src = '';
		  reject(new Error('Timeout'));
		  this.markFailed(url);
		}, highPriority ? 30000 : 15000);
  
		img.onload = () => {
		  clearTimeout(timeout);
		  this.markLoaded(url);
		  resolve();
		};
  
		img.onerror = () => {
		  clearTimeout(timeout);
		  this.markFailed(url);
		  // Не пробрасываем жёстко исключение наружу при финальном провале — просто завершаем с reject
		  reject(new Error('Failed to load: ' + url));
		};
  
		// Устанавливаем приоритет загрузки
		if ('fetchpriority' in img) {
		  (img as any).fetchpriority = highPriority ? 'high' : 'low';
		}
  
		img.src = url;
	  });
  
  	this.loading.set(url, loadPromise);
  
	  try {
		await loadPromise;
	  } finally {
		// если был успех или окончательный провал — убрать из loading (если еще не убрали)
		this.loading.delete(url);
		this.activeLoads--;
	  }
  
	  return loadPromise;
	}
  
	subscribe(url: string, callback: () => void): () => void {
	  if (!url) return () => {};
	  
	  if (!this.subscribers.has(url)) {
		this.subscribers.set(url, new Set());
	  }
	  this.subscribers.get(url)!.add(callback);
	  
	  // Если изображение уже загружено, вызываем callback сразу
	  if (this.isLoaded(url)) {
		// Используем микротаск для избежания проблем с синхронным вызовом
		queueMicrotask(() => callback());
	  }
	  
	  return () => {
		const subs = this.subscribers.get(url);
		if (subs) {
		  subs.delete(callback);
		  if (subs.size === 0) {
			this.subscribers.delete(url);
		  }
		}
	  };
	}
  
	private notify(url: string): void {
	  const subs = this.subscribers.get(url);
	  if (subs) {
		// Копируем set чтобы избежать проблем с модификацией во время итерации
		const callbacks = Array.from(subs);
		// Используем микротаски для избежания блокировки
		queueMicrotask(() => {
		  callbacks.forEach(callback => callback());
		});
	  }
	}
  
	getCachedSrc(url: string): string {
	  // Возвращаем оригинальный URL - браузер сам управляет кешем
	  return url;
	}
  
	// Метод для предзагрузки с учетом viewport
	preloadVisible(urls: string[], viewportMargin: number = 100): void {
	  if (typeof window === 'undefined') return;
	  
	  const viewportHeight = window.innerHeight;
	  const threshold = viewportHeight + viewportMargin;
	  
	  const visible: string[] = [];
	  const upcoming: string[] = [];
	  
	  urls.forEach((url, index) => {
		// Приблизительная оценка позиции (можно улучшить с реальными позициями)
		const estimatedPosition = index * 200; // предполагаем высоту элемента
		
		if (estimatedPosition < threshold) {
		  visible.push(url);
		} else if (estimatedPosition < threshold * 2) {
		  upcoming.push(url);
		}
	  });
	  
	  // Загружаем видимые с высоким приоритетом
	  this.preload(visible, { priority: 'high', concurrency: 4 });
	  
	  // Загружаем следующие с низким приоритетом
	  setTimeout(() => {
		this.preload(upcoming, { priority: 'low', concurrency: 2 });
	  }, 500);
	}
  
	// Статистика для отладки
	getStats() {
	  return {
		loaded: this.loaded.size,
		loading: this.loading.size,
		failed: this.failed.size,
		queued: this.loadQueue.length,
		activeLoads: this.activeLoads
	  };
	}
  
	// Очистка с сохранением успешно загруженных
	clearFailed(): void {
	  this.failed.clear();
	  this.loadQueue = [];
	  this.retryCounts.clear();
	}
  
	// Полная очистка
	clear(): void {
	  this.loaded.clear();
	  this.loading.clear();
	  this.failed.clear();
	  this.subscribers.clear();
	  this.loadQueue = [];
	  this.activeLoads = 0;
	  this.retryCounts.clear();
	}
  }
  
  export const imageCache = new SimpleImageCache();
  
  // Улучшенные хелперы
  export const preloadCaseImages = (cases: Array<{ image: string }>, priorityCount = 6) => {
	const images = cases.map(c => c.image).filter(Boolean);
	
	if (images.length === 0) return;
	
	const priority = images.slice(0, priorityCount);
	const remaining = images.slice(priorityCount);
  
	// Загружаем приоритетные с высоким приоритетом
	imageCache.preload(priority, { 
	  concurrency: 3, 
	  priority: 'high' 
	});
	
	// Остальные с задержкой и низким приоритетом
	if (remaining.length > 0) {
	  requestIdleCallback(() => {
		imageCache.preload(remaining, { 
		  concurrency: 2, 
		  priority: 'low' 
		});
	  }, { timeout: 2000 });
	}
  };
  
  export const preloadBannerAssets = (assets: string[]) => {
	// Баннеры обычно важны, загружаем с высоким приоритетом
	imageCache.preload(assets, { 
	  concurrency: 3, 
	  priority: 'high' 
	});
  };