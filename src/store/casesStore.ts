import { create } from 'zustand';
import { Case } from '@/types/game';
import { ASSET_PATHS } from '@/utils/constants';

interface CasesState {
  cases: Case[];
  isLoading: boolean;
  error: string | null;
}

interface CasesActions {
  setCases: (cases: Case[]) => void;
  addCase: (caseData: Case) => void;
  removeCase: (caseId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const mockCases: Case[] = [
  {
    id: 1,
    name: 'Free Case',
    image: ASSET_PATHS.IMAGES.FREE_CASE,
    price: 0,
    background: '#0088FF',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSET_PATHS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Scroll', price: 24.06, image: ASSET_PATHS.IMAGES.SCROLL, rarity: 'common' },
      { id: 3, name: 'TON', price: 5.50, image: ASSET_PATHS.IMAGES.TOKEN, rarity: 'common' },
      { id: 4, name: 'TON', price: 15.75, image: ASSET_PATHS.IMAGES.TOKEN_GOLD, rarity: 'rare' },
      { id: 5, name: 'Wizard Hat', price: 35.20, image: ASSET_PATHS.IMAGES.WIZARD_HAT, rarity: 'rare' },
      { id: 6, name: 'Helmet', price: 18.90, image: ASSET_PATHS.IMAGES.HELMET, rarity: 'rare' },
      { id: 7, name: 'Diamond', price: 48.15, image: ASSET_PATHS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 8, name: 'Burger', price: 12.30, image: ASSET_PATHS.IMAGES.BURGER, rarity: 'common' },
      { id: 9, name: 'Dragon', price: 89.99, image: ASSET_PATHS.IMAGES.DRAGON, rarity: 'epic' },
      { id: 10, name: 'Frog', price: 1562.28, image: ASSET_PATHS.IMAGES.FROG, rarity: 'legendary' },
      { id: 11, name: 'Gift', price: 25.00, image: ASSET_PATHS.IMAGES.GIFT, rarity: 'rare' },
      { id: 12, name: 'Lightning', price: 42.50, image: ASSET_PATHS.IMAGES.LIGHTNING, rarity: 'epic' },
    ]
  },
  {
    id: 2,
    name: 'Heroic helmet',
    image: ASSET_PATHS.IMAGES.HELMET,
    price: 5,
    background: '#8B4513',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSET_PATHS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Scroll', price: 24.06, image: ASSET_PATHS.IMAGES.SCROLL, rarity: 'common' },
      { id: 3, name: 'Frog', price: 1562.28, image: ASSET_PATHS.IMAGES.FROG, rarity: 'legendary' },
      { id: 4, name: 'Diamond', price: 48.15, image: ASSET_PATHS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 5, name: 'TON', price: 5.50, image: ASSET_PATHS.IMAGES.TOKEN, rarity: 'common' },
      { id: 6, name: 'TON', price: 15.75, image: ASSET_PATHS.IMAGES.TOKEN_GOLD, rarity: 'rare' },
      { id: 7, name: 'Wizard Hat', price: 35.20, image: ASSET_PATHS.IMAGES.WIZARD_HAT, rarity: 'rare' },
      { id: 8, name: 'Helmet', price: 18.90, image: ASSET_PATHS.IMAGES.HELMET, rarity: 'rare' },
      { id: 9, name: 'Burger', price: 12.30, image: ASSET_PATHS.IMAGES.BURGER, rarity: 'common' },
      { id: 10, name: 'Dragon', price: 89.99, image: ASSET_PATHS.IMAGES.DRAGON, rarity: 'epic' },
      { id: 11, name: 'Gift', price: 25.00, image: ASSET_PATHS.IMAGES.GIFT, rarity: 'rare' },
      { id: 12, name: 'Lightning', price: 42.50, image: ASSET_PATHS.IMAGES.LIGHTNING, rarity: 'epic' },
    ]
  },
  {
    id: 3,
    name: 'Dragon Scale',
    image: ASSET_PATHS.IMAGES.DRAGON,
    price: 10,
    background: '#FF4500',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSET_PATHS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Scroll', price: 24.06, image: ASSET_PATHS.IMAGES.SCROLL, rarity: 'common' },
      { id: 3, name: 'TON', price: 5.50, image: ASSET_PATHS.IMAGES.TOKEN, rarity: 'common' },
      { id: 4, name: 'TON', price: 15.75, image: ASSET_PATHS.IMAGES.TOKEN_GOLD, rarity: 'rare' },
      { id: 5, name: 'Wizard Hat', price: 35.20, image: ASSET_PATHS.IMAGES.WIZARD_HAT, rarity: 'rare' },
      { id: 6, name: 'Helmet', price: 18.90, image: ASSET_PATHS.IMAGES.HELMET, rarity: 'rare' },
      { id: 7, name: 'Diamond', price: 48.15, image: ASSET_PATHS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 8, name: 'Burger', price: 12.30, image: ASSET_PATHS.IMAGES.BURGER, rarity: 'common' },
      { id: 9, name: 'Dragon', price: 89.99, image: ASSET_PATHS.IMAGES.DRAGON, rarity: 'epic' },
      { id: 10, name: 'Frog', price: 1562.28, image: ASSET_PATHS.IMAGES.FROG, rarity: 'legendary' },
      { id: 11, name: 'Gift', price: 25.00, image: ASSET_PATHS.IMAGES.GIFT, rarity: 'rare' },
      { id: 12, name: 'Lightning', price: 42.50, image: ASSET_PATHS.IMAGES.LIGHTNING, rarity: 'epic' },
    ]
  },
  {
    id: 4,
    name: 'Mystic Frog',
    image: ASSET_PATHS.IMAGES.FROG,
    price: 20,
    background: '#FFD700',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSET_PATHS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Scroll', price: 24.06, image: ASSET_PATHS.IMAGES.SCROLL, rarity: 'common' },
      { id: 3, name: 'TON', price: 5.50, image: ASSET_PATHS.IMAGES.TOKEN, rarity: 'common' },
      { id: 4, name: 'TON', price: 15.75, image: ASSET_PATHS.IMAGES.TOKEN_GOLD, rarity: 'rare' },
      { id: 5, name: 'Wizard Hat', price: 35.20, image: ASSET_PATHS.IMAGES.WIZARD_HAT, rarity: 'rare' },
      { id: 6, name: 'Helmet', price: 18.90, image: ASSET_PATHS.IMAGES.HELMET, rarity: 'rare' },
      { id: 7, name: 'Diamond', price: 48.15, image: ASSET_PATHS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 8, name: 'Burger', price: 12.30, image: ASSET_PATHS.IMAGES.BURGER, rarity: 'common' },
      { id: 9, name: 'Dragon', price: 89.99, image: ASSET_PATHS.IMAGES.DRAGON, rarity: 'epic' },
      { id: 10, name: 'Frog', price: 1562.28, image: ASSET_PATHS.IMAGES.FROG, rarity: 'legendary' },
      { id: 11, name: 'Gift', price: 25.00, image: ASSET_PATHS.IMAGES.GIFT, rarity: 'rare' },
      { id: 12, name: 'Lightning', price: 42.50, image: ASSET_PATHS.IMAGES.LIGHTNING, rarity: 'epic' },
    ]
  },
  {
    id: 5,
    name: 'Golden Gift',
    image: ASSET_PATHS.IMAGES.GIFT,
    price: 1,
    background: '#32CD32',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSET_PATHS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'TON', price: 5.50, image: ASSET_PATHS.IMAGES.TOKEN, rarity: 'common' },
      { id: 3, name: 'TON', price: 15.75, image: ASSET_PATHS.IMAGES.TOKEN_GOLD, rarity: 'rare' },
      { id: 4, name: 'Gift', price: 25.00, image: ASSET_PATHS.IMAGES.GIFT, rarity: 'rare' },
    ]
  },
  {
    id: 6,
    name: 'Magic Scroll',
    image: ASSET_PATHS.IMAGES.SCROLL,
    price: 3,
    background: '#4169E1',
    items: [
      { id: 1, name: 'Scroll', price: 24.06, image: ASSET_PATHS.IMAGES.SCROLL, rarity: 'common' },
      { id: 2, name: 'Wizard Hat', price: 35.20, image: ASSET_PATHS.IMAGES.WIZARD_HAT, rarity: 'rare' },
      { id: 3, name: 'Diamond', price: 48.15, image: ASSET_PATHS.IMAGES.DIAMOND, rarity: 'epic' },
    ]
  },
  {
    id: 7,
    name: 'Bear Dream',
    image: ASSET_PATHS.IMAGES.TEDDY,
    price: 25,
    background: '#FF1493',
    items: [
      { id: 1, name: 'Teddy Bear', price: 10.91, image: ASSET_PATHS.IMAGES.TEDDY, rarity: 'common' },
      { id: 2, name: 'Frog', price: 1562.28, image: ASSET_PATHS.IMAGES.FROG, rarity: 'legendary' },
    ]
  },
  {
    id: 8,
    name: 'Diamond Vault',
    image: ASSET_PATHS.IMAGES.DIAMOND,
    price: 50,
    background: '#8A2BE2',
    items: [
      { id: 1, name: 'Diamond', price: 48.15, image: ASSET_PATHS.IMAGES.DIAMOND, rarity: 'epic' },
      { id: 2, name: 'Frog', price: 1562.28, image: ASSET_PATHS.IMAGES.FROG, rarity: 'legendary' },
    ]
  }
];

export const useCasesStore = create<CasesState & CasesActions>((set) => ({
  cases: mockCases,
  isLoading: false,
  error: null,

  setCases: (cases) => set({ cases }),

  addCase: (caseData) =>
    set((state) => ({
      cases: [...state.cases, caseData]
    })),

  removeCase: (caseId) =>
    set((state) => ({
      cases: state.cases.filter(c => c.id !== caseId)
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error })
})); 