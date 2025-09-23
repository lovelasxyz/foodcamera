import { IShardSystem, ShardProgress } from './IShardSystem';
import { Prize } from '@/types/game';
import { ShardRecipeMapper } from './ShardRecipeMapper';

export class ShardSystem implements IShardSystem {
  addShard(shards: Record<string, number>, key: string, count: number): Record<string, number> {
    const current = shards?.[key] || 0;
    return { ...(shards || {}), [key]: current + count };
  }

  canCraft(shards: Record<string, number>, key: string): boolean {
    const cfg = ShardRecipeMapper.fromConstants().find(r => r.key === key);
    if (!cfg) return false;
    const have = shards?.[key] || 0;
    return have >= cfg.required;
  }

  craft(
    shards: Record<string, number>,
    shardUpdatedAt: Record<string, number>,
    key: string
  ): { updatedShards: Record<string, number>; updatedShardUpdatedAt: Record<string, number>; prize: Prize } | null {
    const cfg = ShardRecipeMapper.fromConstants().find(r => r.key === key);
    if (!cfg) return null;
    const have = shards?.[key] || 0;
    if (have < cfg.required) return null;

    const prize: Prize = {
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

    const remaining = Math.max(0, have - cfg.required);
    const nextShards = { ...(shards || {}) } as Record<string, number>;
    const nextShardUpdatedAt = { ...(shardUpdatedAt || {}) } as Record<string, number>;
    if (remaining <= 0) {
      delete nextShards[key];
      delete nextShardUpdatedAt[key];
    } else {
      nextShards[key] = remaining;
      nextShardUpdatedAt[key] = Date.now();
    }

    return { updatedShards: nextShards, updatedShardUpdatedAt: nextShardUpdatedAt, prize };
  }

  getProgress(shards: Record<string, number>, key: string): ShardProgress {
    const cfg = ShardRecipeMapper.fromConstants().find(r => r.key === key);
    return {
      key,
      count: shards?.[key] || 0,
      required: cfg?.required ?? 0
    };
  }
}


