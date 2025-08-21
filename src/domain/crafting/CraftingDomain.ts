import { Prize } from '@/types/game';
import { SHARD_PRODUCTS } from '@/utils/constants';

export class CraftingDomain {
	public static exists(shardKey: string): boolean {
		return !!SHARD_PRODUCTS[shardKey];
	}

	public static requiredCount(shardKey: string): number {
		return SHARD_PRODUCTS[shardKey]?.required ?? Infinity;
	}

	public static canCraft(shardKey: string, haveCount: number): boolean {
		const required = this.requiredCount(shardKey);
		return haveCount >= required;
	}

	public static buildPrize(shardKey: string): Prize | null {
		const cfg = SHARD_PRODUCTS[shardKey];
		if (!cfg) return null;
		return {
			id: cfg.id,
			name: cfg.name,
			price: cfg.price,
			image: cfg.image,
			rarity: cfg.rarity
		};
	}

	public static craft(shardKey: string, haveCount: number): { prize: Prize; remaining: number } | null {
		const cfg = SHARD_PRODUCTS[shardKey];
		if (!cfg) return null;
		if (haveCount < cfg.required) return null;
		const prize = this.buildPrize(shardKey)!;
		const remaining = Math.max(0, haveCount - cfg.required);
		return { prize, remaining };
	}
}



