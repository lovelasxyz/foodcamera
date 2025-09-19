import { ASSETS } from '@/constants/assets';
import { Case, Prize } from '@/types/game';

export const mockCases: Case[] = [
  {
    id: 1,
    name: 'Free Case',
    image: ASSETS.IMAGES.FREE_CASE,
    price: 0,
    background: '#0088FF',
    items: [
      { id: 100, name: 'Gift Shard', price: 0, image: ASSETS.SHARDS.GIFT_SHARD, rarity: 'common', isShard: true, shardKey: 'gift', shardsRequired: 10 } as Prize,
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSETS.IMAGES.TEDDY, rarity: 'common' },
    ]
  },
  {
    id: 2,
    name: 'Heroic helmet',
    image: ASSETS.IMAGES.HELMET,
    price: 5,
    background: '#8B4513',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSETS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Scroll', price: 24.06, image: ASSETS.IMAGES.SCROLL, rarity: 'rare' },
      { id: 3, name: 'Frog', price: 1562, image: ASSETS.IMAGES.FROG, rarity: 'legendary' },
      { id: 4, name: 'Diamond', price: 48.15, image: ASSETS.IMAGES.DIAMOND, rarity: 'epic' },
    ]
  },
  {
    id: 3,
    name: 'Dragon Scale',
    image: ASSETS.IMAGES.DRAGON,
    price: 10,
    background: '#FF4500',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSETS.IMAGES.TEDDY, rarity: 'common' },
      { id: 4, name: 'Diamond', price: 48.15, image: ASSETS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 9, name: 'Dragon', price: 89.99, image: ASSETS.IMAGES.DRAGON, rarity: 'epic' },
    ]
  },
  {
    id: 4,
    name: 'Mystic Frog',
    image: ASSETS.IMAGES.FROG,
    price: 20,
    background: '#FFD700',
    items: [
      { id: 2, name: 'Scroll', price: 24.06, image: ASSETS.IMAGES.SCROLL, rarity: 'rare' },
      { id: 10, name: 'Frog', price: 1562, image: ASSETS.IMAGES.FROG, rarity: 'legendary' },
    ]
  },
  {
    id: 5,
    name: 'Mystic Frog',
    image: ASSETS.IMAGES.FROG,
    price: 20,
    background: '#FFD700',
    items: [
      { id: 2, name: 'Scroll', price: 24.06, image: ASSETS.IMAGES.SCROLL, rarity: 'rare' },
      { id: 10, name: 'Frog', price: 1562, image: ASSETS.IMAGES.FROG, rarity: 'legendary' },
    ]
  },
  {
    id: 6,
    name: 'Golden Gift',
    image: ASSETS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: [
      { id: 2, name: 'TON', price: 5.50, image: ASSETS.IMAGES.TOKEN, rarity: 'common' },
      { id: 4, name: 'Gift', price: 25.00, image: ASSETS.IMAGES.GIFT, rarity: 'rare' },
    ]
  },
  {
    id: 7,
    name: 'Golden Gift',
    image: ASSETS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: [
      { id: 2, name: 'TON', price: 5.50, image: ASSETS.IMAGES.TOKEN, rarity: 'common' },
      { id: 4, name: 'Gift', price: 25.00, image: ASSETS.IMAGES.GIFT, rarity: 'rare' },
    ]
  },
  {
    id: 8,
    name: 'Golden Gift',
    image: ASSETS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: [
      { id: 2, name: 'TON', price: 5.50, image: ASSETS.IMAGES.TOKEN, rarity: 'common' },
      { id: 4, name: 'Gift', price: 25.00, image: ASSETS.IMAGES.GIFT, rarity: 'rare' },
    ]
  },
];



