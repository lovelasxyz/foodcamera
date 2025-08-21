import { CraftingDomain } from '@/domain/crafting/CraftingDomain';
import { Inventory } from '@/domain/inventory/Inventory';
import { InventoryItem } from '@/types/user';

type GetShardCountFn = (key: string) => number;
type SetShardsFn = (key: string, newCount: number) => void;
type AddInventoryFn = (item: InventoryItem) => void;

export class CraftItemUseCase {
	constructor(
		private readonly getShardCount: GetShardCountFn,
		private readonly setShards: SetShardsFn,
		private readonly addInventoryItem: AddInventoryFn
	) {}

	public tryCraft(shardKey: string, fromCase: string = 'Craft'): boolean {
		const have = this.getShardCount(shardKey);
		const result = CraftingDomain.craft(shardKey, have);
		if (!result) return false;
		const inventoryItem = Inventory.createInventoryItem(result.prize, fromCase);
		this.addInventoryItem(inventoryItem);
		// Если остаток 0 — очистим счётчик, чтобы не показывать 0/N
		this.setShards(shardKey, Math.max(0, result.remaining));
		return true;
	}
}



