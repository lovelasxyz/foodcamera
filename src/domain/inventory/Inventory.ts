import { Prize } from '@/types/game';
import { InventoryItem } from '@/types/user';

/**
 * Доменная модель инвентаря пользователя с методами для добавления, продажи и крафта.
 */
export class Inventory {
	public static createInventoryItem(prize: Prize, fromCase: string): InventoryItem {
		return {
			id: `${Date.now()}-${prize.id}`,
			prize,
			obtainedAt: Date.now(),
			fromCase
		};
	}
}



