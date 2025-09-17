import { ASSETS } from '@/constants/assets';

export type LiveRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BaseMockItem {
  image: string;
  name: string;
  price: number;
}

export const baseMock: BaseMockItem[] = [
  { image: ASSETS.IMAGES.FROG, name: 'Mystic Frog', price: 1562 },
  { image: ASSETS.IMAGES.DIAMOND, name: 'Diamond', price: 48.15 },
  { image: ASSETS.IMAGES.DRAGON, name: 'Dragon', price: 89.99 },
  { image: ASSETS.IMAGES.WIZARD_HAT, name: 'Wizard Hat', price: 35.20 },
  { image: ASSETS.IMAGES.HELMET, name: 'Knight Helmet', price: 75.50 },
  { image: ASSETS.IMAGES.SCROLL, name: 'Ancient Scroll', price: 120.00 },
  { image: ASSETS.IMAGES.TEDDY, name: 'Cursed Teddy', price: 66.60 },
  { image: ASSETS.IMAGES.GIFT, name: 'Mystery Gift', price: 25.00 },
  { image: ASSETS.IMAGES.LIGHTNING, name: 'Lightning', price: 42.50 },
  { image: ASSETS.IMAGES.BURGER, name: 'Burger', price: 12.3 },
  { image: ASSETS.IMAGES.TON, name: 'TON', price: 5.5 },
  { image: ASSETS.IMAGES.TOKEN, name: 'TON', price: 15.75 },
];

export const RARITY_BY_IMAGE: Record<string, LiveRarity> = {
  [ASSETS.IMAGES.TEDDY]: 'common',
  [ASSETS.IMAGES.BURGER]: 'common',
  [ASSETS.IMAGES.SCROLL]: 'rare',
  [ASSETS.IMAGES.WIZARD_HAT]: 'rare',
  [ASSETS.IMAGES.HELMET]: 'rare',
  [ASSETS.IMAGES.GIFT]: 'rare',
  [ASSETS.IMAGES.DIAMOND]: 'epic',
  [ASSETS.IMAGES.DRAGON]: 'epic',
  [ASSETS.IMAGES.LIGHTNING]: 'epic',
  [ASSETS.IMAGES.FROG]: 'legendary',
  [ASSETS.IMAGES.TON]: 'common',
};

export const resolveRarity = (image: string): LiveRarity => RARITY_BY_IMAGE[image] || 'common';
