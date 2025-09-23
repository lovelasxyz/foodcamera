import type { Prize } from '@/types/game';
import type { ProductProps } from '@/domain/product/Product';

export const PrizeMapper = {
  fromProduct(p: ProductProps): Prize {
    return {
      id: Number(p.id),
      name: p.name,
      price: p.price,
      image: p.image,
      rarity: p.rarity,
      benefit: p.benefit,
      uniqueKey: p.uniqueKey,
      stackable: p.stackable,
      notAwardIfOwned: p.notAwardIfOwned,
      nonRemovableGift: p.nonRemovableGift
    };
  }
};
