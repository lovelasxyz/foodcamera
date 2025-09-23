import { Prize } from '@/types/game';
import { ShardRecipeMapper } from '@/domain/shards/ShardRecipeMapper';

export class CraftingDomain {
		public static exists(shardKey: string): boolean {
			return ShardRecipeMapper.fromConstants().some(r => r.key === shardKey);
	}

	public static requiredCount(shardKey: string): number {
			return ShardRecipeMapper.fromConstants().find(r => r.key === shardKey)?.required ?? Infinity;
	}

	public static canCraft(shardKey: string, haveCount: number): boolean {
		const required = this.requiredCount(shardKey);
		return haveCount >= required;
	}

		public static buildPrize(shardKey: string): Prize | null {
			const cfg = ShardRecipeMapper.fromConstants().find(r => r.key === shardKey);
		if (!cfg) return null;
		return {
				id: cfg.product.id,
				name: cfg.product.name,
				price: cfg.product.price,
				image: cfg.product.image,
				rarity: cfg.product.rarity,
				benefit: cfg.product.benefit,
				uniqueKey: cfg.product.uniqueKey,
				stackable: cfg.product.stackable,
				notAwardIfOwned: cfg.product.notAwardIfOwned,
				nonRemovableGift: cfg.product.nonRemovableGift
		};
	}

	public static craft(shardKey: string, haveCount: number): { prize: Prize; remaining: number } | null {
			const cfg = ShardRecipeMapper.fromConstants().find(r => r.key === shardKey);
		if (!cfg) return null;
		if (haveCount < cfg.required) return null;
			const prize = this.buildPrize(shardKey)!;
		const remaining = Math.max(0, haveCount - cfg.required);
		return { prize, remaining };
	}
}






