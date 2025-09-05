import { create } from 'zustand';
import { ASSETS } from '@/constants/assets';

export type LiveRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface LiveItem {
  id: number;
  image: string;
  name: string;
  price: number;
  userName: string;
  rarity: LiveRarity;
}

// Базовые предметы (без id/userName/rarity)
const baseMock: Array<{ image: string; name: string; price: number }> = [
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

const RARITY_BY_IMAGE: Record<string, LiveRarity> = {
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

const resolveRarity = (image: string): LiveRarity => RARITY_BY_IMAGE[image] || 'common';

interface LiveState {
  items: LiveItem[];
  lastAddedId: number | null;
  started: boolean;
}

interface LiveActions {
  init: () => void;
}

const MAX_VISIBLE = 18;

class LiveFeed {
  private timerId: number | null = null;
  private readonly intervalMs: number;
  private readonly setState: (partial: Partial<LiveState>) => void;
  private readonly getState: () => LiveState;

  constructor(setState: (partial: Partial<LiveState>) => void, getState: () => LiveState, intervalMs = 5000) {
    this.setState = setState;
    this.getState = getState;
    this.intervalMs = intervalMs;
  }

  public ensureStarted(): void {
    const state = this.getState();
    if (!state.started) {
      const initialItems = state.items.length > 0 ? state.items : this.generateInitial();
      this.setState({ items: initialItems, started: true });
    }
    if (this.timerId == null) {
      this.timerId = setInterval(() => this.addRandomItem(), this.intervalMs) as unknown as number;
    }
  }

  private generateInitial(): LiveItem[] {
    return Array.from({ length: MAX_VISIBLE - 2 }, (_, i) => {
      const randomItem = baseMock[Math.floor(Math.random() * baseMock.length)];
      return {
        id: Date.now() + i,
        image: randomItem.image,
        name: randomItem.name,
        price: randomItem.price,
        userName: `User${Math.floor(Math.random() * 1000)}`,
        rarity: resolveRarity(randomItem.image),
      } as LiveItem;
    });
  }

  private addRandomItem(): void {
    const randomItem = baseMock[Math.floor(Math.random() * baseMock.length)];
    const nextItem: LiveItem = {
      id: Date.now(),
      image: randomItem.image,
      name: randomItem.name,
      price: randomItem.price,
      userName: `User${Math.floor(Math.random() * 1000)}`,
      rarity: resolveRarity(randomItem.image),
    };
    const state = this.getState();
    const prepended = [nextItem, ...state.items];
    if (prepended.length > MAX_VISIBLE) {
      prepended.pop();
    }
    this.setState({ items: prepended, lastAddedId: nextItem.id });
  }
}

export const useLiveStore = create<LiveState & LiveActions>((set, get) => {
  const feed = new LiveFeed(set, get, 5000);
  return {
    items: [],
    lastAddedId: null,
    started: false,
    init: () => feed.ensureStarted(),
  };
});


