import { create } from 'zustand';
import { User, InventoryItem } from '@/types/user';
import { Prize } from '@/types/game';
import { ParsedTelegramUser } from '@/types/telegram';

interface UserState {
  user: User;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface UserActions {
  setUser: (user: User) => void;
  setTelegramUser: (telegramUser: ParsedTelegramUser) => void;
  updateBalance: (amount: number) => void;
  addToInventory: (prize: Prize, fromCase: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  disconnectWallet: () => void;
  resetUser: () => void;
}

// Дефолтный пользователь (fallback)
const defaultUser: User = {
  id: 'guest',
  name: 'Guest User',
  avatar: '/assets/images/avatar.png',
  balance: 100.00, // Начальный баланс 100 монет
  wallet: undefined,
  inventory: []
};

// Функция для преобразования Telegram пользователя в пользователя приложения
const createUserFromTelegram = (telegramUser: ParsedTelegramUser): User => {
  return {
    id: telegramUser.id,
    name: telegramUser.name,
    avatar: telegramUser.avatar || '/assets/images/avatar.png',
    balance: 100.00, // Начальный баланс для новых пользователей
    wallet: undefined,
    inventory: []
  };
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  user: defaultUser,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: true,
    error: null 
  }),

  setTelegramUser: (telegramUser) => {
    const user = createUserFromTelegram(telegramUser);
    set({ 
      user, 
      isAuthenticated: true,
      error: null,
      isLoading: false
    });
  },

  updateBalance: (amount) => 
    set((state) => ({
      user: {
        ...state.user,
        balance: Math.max(0, state.user.balance + amount)
      }
    })),

  addToInventory: (prize, fromCase) =>
    set((state) => {
      const inventoryItem: InventoryItem = {
        id: `${Date.now()}-${prize.id}`,
        prize,
        obtainedAt: Date.now(),
        fromCase
      };
      
      return {
        user: {
          ...state.user,
          inventory: [...state.user.inventory, inventoryItem]
        }
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  disconnectWallet: () =>
    set((state) => ({
      user: {
        ...state.user,
        wallet: undefined
      }
    })),

  resetUser: () => set({
    user: defaultUser,
    isAuthenticated: false,
    error: null,
    isLoading: false
  })
})); 