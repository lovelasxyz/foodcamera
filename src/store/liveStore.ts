import { create } from 'zustand';
import { baseMock, resolveRarity, type LiveRarity } from '@/mocks/live.mock';

export interface LiveItem {
  id: number;
  image: string;
  name: string;
  price: number;
  userName: string;
  rarity: LiveRarity;
}

interface LiveState {
  items: LiveItem[];
  lastAddedId: number | null;
  started: boolean;
}

interface LiveActions {
  init: () => void;
  stop: () => void;
}

const MAX_VISIBLE = 30;

class LiveFeed {
  private timerId: ReturnType<typeof setInterval> | null = null;
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
      this.timerId = setInterval(() => this.addRandomItem(), this.intervalMs);
    }
  }

  // Stop the feed and clear timer
  public stop(): void {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
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
    stop: () => feed.stop(),
  };
});


