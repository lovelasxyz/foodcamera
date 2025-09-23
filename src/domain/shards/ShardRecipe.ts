import type { ProductBenefit } from '@/types/game';

export interface ShardRecipe {
  key: string;
  required: number;
  shardImage: string;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    benefit?: ProductBenefit;
    uniqueKey?: string;
    stackable?: boolean;
    notAwardIfOwned?: boolean;
    nonRemovableGift?: boolean;
  };
}
