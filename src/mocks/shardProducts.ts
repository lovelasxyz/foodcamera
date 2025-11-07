import { ASSETS } from '@/constants/assets';

// Продукты сборки осколков (мок-данные для дев/стенда)
export const SHARD_PRODUCTS: Record<string, {
  id: number;
  name: string;
  price: number;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  required: number;
  shardImage: string;
  // Доп. поля для итогового приза
  benefit?: import('@/types/game').ProductBenefit;
  uniqueKey?: string;
  stackable?: boolean;
  notAwardIfOwned?: boolean;
  nonRemovableGift?: boolean;
}> = {
  gift: {
    id: 10001,
    name: 'Gift',
    price: 25,
    image: ASSETS.SHARDS.GIFT,
    rarity: 'rare',
    required: 10,
    shardImage: ASSETS.SHARDS.GIFT_SHARD
  },
  discount_10: {
    id: 11010,
    name: 'Discount 10%',
    price: 10,
    image: ASSETS.IMAGES.SCROLL,
    rarity: 'common',
    required: 10,
    shardImage: ASSETS.SHARDS.GIFT_SHARD,
    benefit: { type: 'discount', percent: 10 },
    uniqueKey: 'discount_10',
    stackable: false,
    notAwardIfOwned: true
  },
  discount_15: {
    id: 11015,
    name: 'Discount 15%',
    price: 10,
    image: ASSETS.IMAGES.SCROLL,
    rarity: 'common',
    required: 10,
    shardImage: ASSETS.SHARDS.GIFT_SHARD,
    benefit: { type: 'discount', percent: 15 },
    uniqueKey: 'discount_15',
    stackable: false,
    notAwardIfOwned: true
  },
  discount_30: {
    id: 11030,
    name: 'Discount 30%',
    price: 10,
    image: ASSETS.IMAGES.SCROLL,
    rarity: 'rare',
    required: 10,
    shardImage: ASSETS.SHARDS.GIFT_SHARD,
    benefit: { type: 'discount', percent: 30 },
    uniqueKey: 'discount_30',
    stackable: false,
    notAwardIfOwned: true
  },
  discount_50: {
    id: 11050,
    name: 'Discount 50%',
    price: 10,
    image: ASSETS.IMAGES.SCROLL,
    rarity: 'epic',
    required: 10,
    shardImage: ASSETS.SHARDS.GIFT_SHARD,
    benefit: { type: 'discount', percent: 50 },
    uniqueKey: 'discount_50',
    stackable: false,
    notAwardIfOwned: true
  },
  tg_premium_3m: {
    id: 12003,
    name: 'Telegram Premium (3m)',
    price: 10,
    image: ASSETS.IMAGES.PROFILE,
    rarity: 'epic',
    required: 10,
    shardImage: ASSETS.SHARDS.TG_PREMIUM_SHARD,
    benefit: { type: 'subscription', service: 'tg_premium', months: 3 },
    uniqueKey: 'tg_premium',
    stackable: false,
    notAwardIfOwned: true,
    nonRemovableGift: true
  },
  lottery_ticket: {
    id: 13001,
    name: 'Lottery Ticket',
    price: 10,
    image: ASSETS.IMAGES.SCROLL,
    rarity: 'rare',
    required: 10,
    shardImage: ASSETS.SHARDS.TICKET_SHARD,
    benefit: { type: 'lottery_ticket' },
    uniqueKey: 'lottery_ticket',
    stackable: true
  }
};
