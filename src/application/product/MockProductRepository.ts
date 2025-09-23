import type { IProductRepository } from './IProductRepository';
import { ProductMapper } from '@/domain/product/ProductMapper';
import { SHARD_PRODUCTS } from '@/mocks/shardProducts';

export class MockProductRepository implements IProductRepository {
  async fetchAll() {
    // Derive products from SHARD_PRODUCTS as a starter catalog
    const entries = Object.values(SHARD_PRODUCTS).map(cfg => ProductMapper.toDomain({
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
    }));
    return entries;
  }
}
