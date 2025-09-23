import type { ProductBenefit } from '@/types/game';

export type ProductRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rarity: ProductRarity;
  benefit?: ProductBenefit;
  uniqueKey?: string;
  stackable?: boolean;
  notAwardIfOwned?: boolean;
  nonRemovableGift?: boolean;
}

export class Product {
  constructor(private readonly props: ProductProps) {}
  get data(): ProductProps { return this.props; }
  get id(): string { return this.props.id; }
  get uniqueKey(): string | undefined { return this.props.uniqueKey; }
}
