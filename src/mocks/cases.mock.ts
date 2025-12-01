import { ASSETS } from '@/constants/assets';
import { Case, Prize } from '@/types/game';
import { PrizeSorter } from '@/utils/prizeSorter';

// Константы для новых призов
const USDT_PRIZES = [
  { id: 20001, name: 'USDT 0.2', price: 0.2, image: ASSETS.IMAGES.TOKEN_GOLD, rarity: 'common' as const, benefit: { type: 'fiat_usdt' as const, amount: 0.2 }, description: 'Фиат USDT. Зачисляется сразу на баланс.' },
  { id: 20002, name: 'USDT 0.3', price: 0.3, image: ASSETS.IMAGES.TOKEN_GOLD, rarity: 'common' as const, benefit: { type: 'fiat_usdt' as const, amount: 0.3 }, description: 'Фиат USDT. Зачисляется сразу на баланс.' },
  { id: 20003, name: 'USDT 0.5', price: 0.5, image: ASSETS.IMAGES.TOKEN_GOLD, rarity: 'common' as const, benefit: { type: 'fiat_usdt' as const, amount: 0.5 }, description: 'Фиат USDT. Зачисляется сразу на баланс.' },
  { id: 20004, name: 'USDT 0.8', price: 0.8, image: ASSETS.IMAGES.TOKEN_GOLD, rarity: 'common' as const, benefit: { type: 'fiat_usdt' as const, amount: 0.8 }, description: 'Фиат USDT. Зачисляется сразу на баланс.' },
] as Prize[];

const WEEKLY_TICKET_PRIZE: Prize = {
  id: 30001,
  name: 'Weekly Lottery Ticket',
  price: 0,
  image: ASSETS.SHARDS.TICKET_SHARD,
  rarity: 'common',
  benefit: { type: 'weekly_ticket' },
  nonRemovableGift: true,
  description: 'Билет на еженедельный розыгрыш. Накапливаются и автоматически списываются через неделю.'
};

const PERMANENT_TOKEN_PRIZE: Prize = {
  id: 40001,
  name: 'Permanent Token',
  price: 0,
  image: ASSETS.IMAGES.TOKEN,
  rarity: 'common',
  benefit: { type: 'permanent_token', amount: 100 },
  nonRemovableGift: true,
  description: 'Постоянный токен. Накапливается без срока действия. Каждое выпадение добавляет 100 токенов.'
};

// Скидки как отдельные призы (не осколки)
const DISCOUNT_PRIZES: Prize[] = [
  { id: 60001, name: 'Discount 10%', price: 10, image: ASSETS.IMAGES.SCROLL, rarity: 'epic', benefit: { type: 'discount', percent: 10 }, nonRemovableGift: true, description: 'Скидка 10% на следующую покупку кейса.' },
  { id: 60002, name: 'Discount 15%', price: 10, image: ASSETS.IMAGES.SCROLL, rarity: 'epic', benefit: { type: 'discount', percent: 15 }, nonRemovableGift: true, description: 'Скидка 15% на следующую покупку кейса.' },
  { id: 60003, name: 'Discount 30%', price: 10, image: ASSETS.IMAGES.SCROLL, rarity: 'legendary', benefit: { type: 'discount', percent: 30 }, nonRemovableGift: true, description: 'Скидка 30% на следующую покупку кейса.' },
  { id: 60004, name: 'Discount 50%', price: 10, image: ASSETS.IMAGES.SCROLL, rarity: 'legendary', benefit: { type: 'discount', percent: 50 }, nonRemovableGift: true, description: 'Скидка 50% на следующую покупку кейса.' },
];

export const mockCases: Case[] = [
  {
    id: 1,
    name: 'Free Case',
    image: ASSETS.IMAGES.FREE_CASE,
    price: 0,
    background: '#0088FF',
    items: PrizeSorter.sortByRarity([
      { id: 11030, name: 'Discount 30% Shard', price: 10, image: ASSETS.SHARDS.GIFT_SHARD, rarity: 'rare', isShard: true, shardKey: 'discount_30', shardsRequired: 10 } as Prize,
      { id: 11050, name: 'Discount 50% Shard', price: 10, image: ASSETS.SHARDS.GIFT_SHARD, rarity: 'rare', isShard: true, shardKey: 'discount_50', shardsRequired: 10 } as Prize,
      { id: 11015, name: 'Discount 15% Shard', price: 10, image: ASSETS.SHARDS.GIFT_SHARD, rarity: 'common', isShard: true, shardKey: 'discount_15', shardsRequired: 10 } as Prize,
      { id: 11010, name: 'Discount 10% Shard', price: 10, image: ASSETS.SHARDS.GIFT_SHARD, rarity: 'common', isShard: true, shardKey: 'discount_10', shardsRequired: 10 } as Prize,
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSETS.IMAGES.TEDDY, rarity: 'common' },
    ])
  },
  {
    id: 2,
    name: 'Heroic helmet',
    image: ASSETS.IMAGES.HELMET,
    price: 5,
    background: '#8B4513',
    items: PrizeSorter.sortByRarity([
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSETS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Scroll', price: 24.06, image: ASSETS.IMAGES.SCROLL, rarity: 'rare' },
      { id: 3, name: 'Frog', price: 1562, image: ASSETS.IMAGES.FROG, rarity: 'legendary' },
      { id: 4, name: 'Diamond', price: 48.15, image: ASSETS.IMAGES.DIAMOND, rarity: 'epic' },
      ...DISCOUNT_PRIZES,
    ])
  },
  {
    id: 3,
    name: 'Dragon Scale',
    image: ASSETS.IMAGES.DRAGON,
    price: 10,
    background: '#FF4500',
    items: PrizeSorter.sortByRarity([
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSETS.IMAGES.TEDDY, rarity: 'common' },
      { id: 4, name: 'Diamond', price: 48.15, image: ASSETS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 9, name: 'Dragon', price: 89.99, image: ASSETS.IMAGES.DRAGON, rarity: 'epic' },
      ...USDT_PRIZES,
      ...DISCOUNT_PRIZES,
      WEEKLY_TICKET_PRIZE,
      PERMANENT_TOKEN_PRIZE,
    ])
  },
  {
    id: 4,
    name: 'Mystic Frog',
    image: ASSETS.IMAGES.FROG,
    price: 20,
    background: '#FFD700',
    items: PrizeSorter.sortByRarity([
      { id: 2, name: 'Scroll', price: 24.06, image: ASSETS.IMAGES.SCROLL, rarity: 'rare' },
      { id: 10, name: 'Frog', price: 1562, image: ASSETS.IMAGES.FROG, rarity: 'legendary' },
      ...USDT_PRIZES,
      ...DISCOUNT_PRIZES,
      WEEKLY_TICKET_PRIZE,
      PERMANENT_TOKEN_PRIZE,
    ])
  },
  {
    id: 5,
    name: 'Mystic Frog',
    image: ASSETS.IMAGES.FROG,
    price: 20,
    background: '#FFD700',
    items: PrizeSorter.sortByRarity([
      { id: 2, name: 'Scroll', price: 24.06, image: ASSETS.IMAGES.SCROLL, rarity: 'rare' },
      { id: 10, name: 'Frog', price: 1562, image: ASSETS.IMAGES.FROG, rarity: 'legendary' },
      ...USDT_PRIZES,
      ...DISCOUNT_PRIZES,
      WEEKLY_TICKET_PRIZE,
      PERMANENT_TOKEN_PRIZE,
    ])
  },
  {
    id: 6,
    name: 'Golden Gift',
    image: ASSETS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: PrizeSorter.sortByRarity([
      { id: 4, name: 'Gift', price: 25.00, image: ASSETS.IMAGES.GIFT, rarity: 'rare' },
      ...USDT_PRIZES,
      ...DISCOUNT_PRIZES,
      WEEKLY_TICKET_PRIZE,
      PERMANENT_TOKEN_PRIZE,
    ])
  },
  {
    id: 7,
    name: 'Golden Gift',
    image: ASSETS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: PrizeSorter.sortByRarity([
      { id: 4, name: 'Gift', price: 25.00, image: ASSETS.IMAGES.GIFT, rarity: 'rare' },
      ...USDT_PRIZES,
      ...DISCOUNT_PRIZES,
      WEEKLY_TICKET_PRIZE,
      PERMANENT_TOKEN_PRIZE,
    ])
  },
  {
    id: 8,
    name: 'Golden Gift',
    image: ASSETS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: PrizeSorter.sortByRarity([
      { id: 4, name: 'Gift', price: 25.00, image: ASSETS.IMAGES.GIFT, rarity: 'rare' },
      ...USDT_PRIZES,
      ...DISCOUNT_PRIZES,
      WEEKLY_TICKET_PRIZE,
      PERMANENT_TOKEN_PRIZE,
    ])
  },
];



