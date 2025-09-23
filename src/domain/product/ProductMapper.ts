import type { ProductProps } from './Product';
import type { Prize } from '@/types/game';

export interface ProductDTO {
  id: string | number;
  name: string;
  price: number;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  benefit?: Prize['benefit'];
  uniqueKey?: string;
  stackable?: boolean;
  notAwardIfOwned?: boolean;
  nonRemovableGift?: boolean;
}

export const ProductMapper = {
  toDomain(dto: ProductDTO): ProductProps {
    return {
      id: String(dto.id),
      name: dto.name,
      price: dto.price,
      image: dto.image,
      rarity: dto.rarity,
      benefit: dto.benefit,
      uniqueKey: dto.uniqueKey,
      stackable: dto.stackable,
      notAwardIfOwned: dto.notAwardIfOwned,
      nonRemovableGift: dto.nonRemovableGift
    };
  },
  toPrize(p: ProductProps): Prize {
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
