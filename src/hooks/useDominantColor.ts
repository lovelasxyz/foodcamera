import { useEffect, useMemo, useState } from 'react';
import { imageCache } from '@/services/ImageCache';
import { runIdle } from '@/utils/idle';


function getDominantColorFromImage(image: HTMLImageElement): string | null {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) return null;

	const width = (canvas.width = Math.max(1, Math.min(64, image.naturalWidth)));
	const height = (canvas.height = Math.max(1, Math.min(64, image.naturalHeight)));

	context.drawImage(image, 0, 0, width, height);

	try {
		const imageData = context.getImageData(0, 0, width, height);
		const { data } = imageData;

		let redTotal = 0;
		let greenTotal = 0;
		let blueTotal = 0;
		let count = 0;

		for (let i = 0; i < data.length; i += 4) {
			const alpha = data[i + 3];
			if (alpha < 16) continue;
			redTotal += data[i];
			greenTotal += data[i + 1];
			blueTotal += data[i + 2];
			count += 1;
		}

		if (count === 0) return null;

		const r = Math.round(redTotal / count);
		const g = Math.round(greenTotal / count);
		const b = Math.round(blueTotal / count);
		return `#${[r, g, b]
			.map((v) => v.toString(16).padStart(2, '0'))
			.join('')}`.toUpperCase();
	} catch {
		// getImageData can fail due to CORS; ignore and return null
		return null;
	}
}

function hexToRgba(hex: string, alpha: number): string {
	const cleaned = hex.replace('#', '');
	const bigint = parseInt(cleaned, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useDominantColor(imageUrl?: string): { colorHex: string | null; rgba: (alpha: number) => string } {
	const [colorHex, setColorHex] = useState<string | null>(null);

	useEffect(() => {
		if (!imageUrl) {
			setColorHex(null);
			return;
		}

		// Try cached color for instant first paint
		const storageKey = `dominantColor:${imageUrl}`;
		try {
			const cached = localStorage.getItem(storageKey);
			if (cached) {
				setColorHex(cached);
				return; // Если есть кэш - не загружаем изображение повторно
			}
		} catch {
			// localStorage may be unavailable (privacy mode/quota); ignore
		}

		let cancelled = false;
		const img = new Image();
		// Attempt to avoid CORS tainting for same-origin assets
		img.crossOrigin = 'anonymous';
		
		// Используем кэшированную версию из ImageCache если доступна
		const cachedSrc = imageCache.getCachedSrc(imageUrl);
		img.src = cachedSrc;
		
		img.decoding = 'async';
		img.loading = 'lazy'; // Изменили на lazy для экономии ресурсов

		const onLoad = () => {
			if (cancelled) return;
					// Отложим вычисление в idle-слот, чтобы не блокировать поток
					const cancel = runIdle(() => {
						if (cancelled) return;
						const color = getDominantColorFromImage(img);
						setColorHex(color);
						if (color) {
										try { localStorage.setItem(storageKey, color); } catch { /* quota or privacy blocked */ }
						}
					});
					// Если размонтируемся — отменим
					if (cancel) {
						// no-op: отмена произойдет в cleanup ниже вместе с флагом cancelled
					}
		};

		const onError = () => {
			if (cancelled) return;
			setColorHex(null);
		};

		img.addEventListener('load', onLoad);
		img.addEventListener('error', onError);

		return () => {
			cancelled = true;
			img.removeEventListener('load', onLoad);
			img.removeEventListener('error', onError);
					try { img.src = ''; } catch { /* ignore cleanup */ }
		};
	}, [imageUrl]);

	const rgba = useMemo(() => {
		return (alpha: number) => (colorHex ? hexToRgba(colorHex, alpha) : 'rgba(0,0,0,0)');
	}, [colorHex]);

	return { colorHex, rgba };
}


