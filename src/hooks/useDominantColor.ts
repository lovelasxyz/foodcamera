import { useEffect, useMemo, useState } from 'react';

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

		let cancelled = false;
		const img = new Image();
		// Attempt to avoid CORS tainting for same-origin assets
		img.crossOrigin = 'anonymous';
		img.src = imageUrl;
		img.decoding = 'async';
		img.loading = 'eager';

		// Try cached color for instant first paint
		const storageKey = `dominantColor:${imageUrl}`;
		try {
			const cached = localStorage.getItem(storageKey);
			if (cached) {
				setColorHex(cached);
			}
		} catch {}

		const onLoad = () => {
			if (cancelled) return;
			const color = getDominantColorFromImage(img);
			setColorHex(color);
			if (color) {
				try { localStorage.setItem(storageKey, color); } catch {}
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
			try { img.src = ''; } catch {}
		};
	}, [imageUrl]);

	const rgba = useMemo(() => {
		return (alpha: number) => (colorHex ? hexToRgba(colorHex, alpha) : 'rgba(0,0,0,0)');
	}, [colorHex]);

	return { colorHex, rgba };
}


