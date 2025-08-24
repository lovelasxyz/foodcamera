import { Case, Prize, RouletteConfig } from '@/types/game';

export interface SpinOutcome {
	position: number;
	prize: Prize;
	prizeIndex: number;
	targetDomIndex: number;
}

/**
 * Объектно-ориентированный движок рулетки.
 * Содержит правила выбора приза и вычисления конечной позиции анимации.
 */
export class RouletteEngine {
	private readonly config: RouletteConfig;

	constructor(config: RouletteConfig) {
		this.config = config;
	}

	/**
	 * Генерирует исход спина: выбранный приз и финальную позицию контейнера.
	 * reelLength — длина ленты (количество DOM-элементов), чтобы целиться в «дальнюю» часть для красивой анимации.
	 */
	public generateSpinOutcome(currentCase: Case, reelLength: number): SpinOutcome {
		const ITEM_WIDTH = this.config.ITEM_WIDTH;
		const totalItems = currentCase.items.length;
		const containerCenter = (reelLength * ITEM_WIDTH) / 2;

		// 1. Выбираем случайный приз
		const randomPrizeIndex = Math.floor(Math.random() * totalItems);
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
}






