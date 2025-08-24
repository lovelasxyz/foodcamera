import { create } from 'zustand';
import { User, InventoryItem } from '@/types/user';
import { Prize } from '@/types/game';
import { ParsedTelegramUser } from '@/types/telegram';
import { SHARD_PRODUCTS } from '@/utils/constants';
import { Inventory } from '@/domain/inventory/Inventory';
import { ASSETS } from '@/constants/assets';
// import { CraftItemUseCase } from '@/application/crafting/CraftItemUseCase';

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
  receiveInventoryItem: (inventoryItemId: string) => void;
  craftFromShards: (shardKey: string, fromCase?: string) => void;
  sellInventoryItem: (inventoryItemId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  disconnectWallet: () => void;
  resetUser: () => void;
}

// Дефолтный пользователь (fallback)
const defaultUser: User = {
  id: 'guest',
  name: 'Guest User',
  avatar: ASSETS.IMAGES.AVATAR,
  balance: 100.00, // Начальный баланс 100 монет
  wallet: undefined,
  inventory: [],
  shards: {},
  lastDrop: null
};

// Функция для преобразования Telegram пользователя в пользователя приложения
const createUserFromTelegram = (telegramUser: ParsedTelegramUser): User => {
  return {
    id: telegramUser.id,
    name: telegramUser.name,
    avatar: telegramUser.avatar || ASSETS.IMAGES.AVATAR,
    balance: 100.00, // Начальный баланс для новых пользователей
    wallet: undefined,
    inventory: [],
    shards: {},
    lastDrop: null
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
      // Обработка осколков — только накапливаем, крафт вручную в craftFromShards
      if (prize.isShard && prize.shardKey) {
        const shardKey = prize.shardKey;
        const currentCount = state.user.shards?.[shardKey] || 0;
        const newCount = currentCount + 1;
        return {
          user: {
            ...state.user,
            shards: { ...state.user.shards, [shardKey]: newCount },
            lastDrop: { kind: 'shard', id: shardKey }
          }
        };
      }

      // Обычный приз — создаем предмет через доменную модель инвентаря
      const inventoryItem: InventoryItem = Inventory.createInventoryItem(prize, fromCase);
      
      return {
        user: {
          ...state.user,
          inventory: [...state.user.inventory, inventoryItem],
          lastDrop: { kind: 'item', id: inventoryItem.id }
        }
      };
    }),

  receiveInventoryItem: (inventoryItemId) =>
    set((state) => {
      const idx = state.user.inventory.findIndex(i => i.id === inventoryItemId);
      if (idx === -1) return state;
      const target = state.user.inventory[idx];
      if (target.status === 'sold' || target.status === 'received') return state;
      const updatedItem: InventoryItem = { ...target, status: 'received' };
      const newInventory = [...state.user.inventory];
      newInventory[idx] = updatedItem;
      return { user: { ...state.user, inventory: newInventory } };
    }),

  craftFromShards: (shardKey, fromCase) =>
    set((state) => {
      const getShardCount = (key: string) => state.user.shards?.[key] || 0;
      // Выполним расчёт через домен, а состояние обновим единым set
      const have = getShardCount(shardKey);
      const cfg = SHARD_PRODUCTS[shardKey];
      if (!cfg || have < cfg.required) return state;

      const fullPrize: Prize = {
        id: cfg.id,
        name: cfg.name,
        price: cfg.price,
        image: cfg.image,
        rarity: cfg.rarity
      };
      const newItem = Inventory.createInventoryItem(fullPrize, fromCase || 'Craft');
      const remaining = Math.max(0, have - cfg.required);

      // Обновим карту осколков: если остаток 0 — удалим ключ, чтобы не показывать 0/5
      const nextShards = { ...(state.user.shards || {}) } as Record<string, number>;
      if (remaining <= 0) {
        delete nextShards[shardKey];
      } else {
        nextShards[shardKey] = remaining;
      }

      return {
        user: {
          ...state.user,
          shards: nextShards,
          inventory: [...state.user.inventory, newItem]
        }
      };
    }),

  sellInventoryItem: (inventoryItemId) =>
    set((state) => {
      const targetIndex = state.user.inventory.findIndex(i => i.id === inventoryItemId);
      if (targetIndex === -1) return state;
      const target = state.user.inventory[targetIndex];
      // If already sold, do nothing
      if (target.status === 'sold') return state;
      const updatedItem: InventoryItem = { ...target, status: 'sold' };
      const newInventory = [...state.user.inventory];
      newInventory[targetIndex] = updatedItem;
      const newBalance = Math.max(0, state.user.balance + (target.prize.price || 0));
      return {
        user: {
          ...state.user,
          balance: newBalance,
          inventory: newInventory
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