import { SHARD_PRODUCTS } from '@/mocks/shardProducts';
import type { ShardRecipe } from './ShardRecipe';

export const ShardRecipeMapper = {
  fromConstants(): ShardRecipe[] {
    return Object.entries(SHARD_PRODUCTS).map(([key, cfg]) => ({
      key,
      required: cfg.required,
      shardImage: cfg.shardImage,
      product: {
        id: cfg.id,
        name: cfg.name,
        price: cfg.price,
        image: cfg.image,
        rarity: cfg.rarity,
        benefit: cfg.benefit,
        uniqueKey: cfg.uniqueKey,
        stackable: cfg.stackable,
        notAwardIfOwned: cfg.notAwardIfOwned,
        nonRemovableGift: cfg.nonRemovableGift
      }
    }));
  }
};
