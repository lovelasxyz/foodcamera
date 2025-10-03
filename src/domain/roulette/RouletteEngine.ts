import { Case, Prize, RouletteConfig } from '@/types/game';

export interface SpinOutcome {
	position: number;
	prize: Prize;
	prizeIndex: number;
	targetDomIndex: number;
	server?: {
		prize?: Partial<Prize> & { id: number };
		position?: number; // authoritative server wheel position if provided
		raw?: unknown; // raw server payload for debug
		userPatch?: { balance?: number; stats?: { spinsCount?: number; lastAuthAt?: number | null }; [k: string]: unknown };
	};
}

export interface BigWinState {
	sinceBigwin: number;
}

/**
 * Объектно-ориентированный движок рулетки.
 * Содержит правила выбора приза и вычисления конечной позиции анимации.
 * FIXED: Removed dependency on UI store (useUserStore) - now accepts state as parameter
 */
export class RouletteEngine {
	private readonly config: RouletteConfig;

	constructor(config: RouletteConfig) {
		this.config = config;
	}

	/**
	 * Генерирует исход спина: выбранный приз и финальную позицию контейнера.
	 * reelLength — длина ленты (количество DOM-элементов), чтобы целиться в «дальнюю» часть для красивой анимации.
	 * bigWinState — внешнее состояние счетчика bigwin (передается извне, не зависит от UI store)
	 */
	public generateSpinOutcome(currentCase: Case, reelLength: number, bigWinState?: BigWinState): SpinOutcome {
		const ITEM_WIDTH = this.config.ITEM_WIDTH;
		const totalItems = currentCase.items.length;
		const containerCenter = (reelLength * ITEM_WIDTH) / 2;

		// 1. Выбираем приз с учетом extra логики (bigwin pity + baseline probability)
		const BIGWIN_PITY_THRESHOLD = 120; // гарантировано после 120 спинов без bigwin
		let sinceBigwin: number = bigWinState?.sinceBigwin ?? 0;

		// Сканируем текущий кейс на наличие bigwin призов
		const bigwinIndices: number[] = [];
		for (let i = 0; i < totalItems; i++) {
			if (currentCase.items[i]?.benefit?.type === 'bigwin') bigwinIndices.push(i);
		}

		let chosenIndex: number;
		if (bigwinIndices.length > 0) {
			// Pity check
			if (sinceBigwin >= BIGWIN_PITY_THRESHOLD) {
				chosenIndex = bigwinIndices[Math.floor(Math.random() * bigwinIndices.length)];
				sinceBigwin = 0;
			} else {
				// baseline chance small (e.g. 0.3%) + scales every 25 спинов без bigwin
				const base = 0.003;
				const bonus = Math.floor(sinceBigwin / 25) * 0.002; // +0.2% каждые 25
				const chance = Math.min(0.05, base + bonus); // не более 5%
				if (Math.random() < chance) {
					chosenIndex = bigwinIndices[Math.floor(Math.random() * bigwinIndices.length)];
					sinceBigwin = 0;
				} else {
					chosenIndex = Math.floor(Math.random() * totalItems);
					sinceBigwin++;
				}
			}
		} else {
			// Нет bigwin призов в кейсе — обычный случай
			chosenIndex = Math.floor(Math.random() * totalItems);
		}

		// Update state externally if provided
		if (bigWinState) {
			bigWinState.sinceBigwin = sinceBigwin;
		}

		const randomPrizeIndex = chosenIndex;
		const selectedPrize = currentCase.items[randomPrizeIndex];

		// 2. Целевая зона в дальней части ленты (75% - 95%)
		const targetZoneStart = Math.floor(reelLength * 0.75);
		const targetZoneEnd = Math.floor(reelLength * 0.95);
		const randomBaseIndex = targetZoneStart + Math.floor(Math.random() * (targetZoneEnd - targetZoneStart));

		// 3. Ищем ближайший индекс DOM для выбранного приза в целевой зоне
		let targetDomIndex = randomBaseIndex;
		while (targetDomIndex % totalItems !== randomPrizeIndex) {
			targetDomIndex++;
			if (targetDomIndex >= targetZoneEnd) {
				targetDomIndex = targetZoneStart;
			}
		}

		// 4. Центр целевого элемента
		const itemCenter = targetDomIndex * ITEM_WIDTH + ITEM_WIDTH / 2;

		// 5. Небольшая случайная неточность остановки
		const randomOffset = (Math.random() - 0.5) * ITEM_WIDTH * 0.8;

		// 6. Финальная позиция (влево от центра контейнера)
		const finalPosition = containerCenter - itemCenter + randomOffset;

		return {
			position: finalPosition,
			prize: selectedPrize,
			prizeIndex: randomPrizeIndex,
			targetDomIndex
		};
	}

	/**
	 * When backend returns a specific prizeId or index, compute the same outcome deterministically.
	 */
	public outcomeForPrizeIndex(currentCase: Case, prizeIndex: number, reelLength: number): SpinOutcome {
		const ITEM_WIDTH = this.config.ITEM_WIDTH;
		const totalItems = currentCase.items.length;
		const containerCenter = (reelLength * ITEM_WIDTH) / 2;

		const targetZoneStart = Math.floor(reelLength * 0.75);
		const targetZoneEnd = Math.floor(reelLength * 0.95);
		let targetDomIndex = targetZoneStart + (Math.floor(Math.random() * (targetZoneEnd - targetZoneStart)));
		while (targetDomIndex % totalItems !== prizeIndex) {
			targetDomIndex++;
			if (targetDomIndex >= targetZoneEnd) targetDomIndex = targetZoneStart;
		}

		const itemCenter = targetDomIndex * ITEM_WIDTH + ITEM_WIDTH / 2;
		const randomOffset = (Math.random() - 0.5) * ITEM_WIDTH * 0.8;
		const finalPosition = containerCenter - itemCenter + randomOffset;
		return {
			position: finalPosition,
			prize: currentCase.items[prizeIndex],
			prizeIndex,
			targetDomIndex
		};
	}
}






