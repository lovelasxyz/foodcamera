import { create } from 'zustand';
import { User, InventoryItem } from '@/types/user';
import { Prize } from '@/types/game';
import { ParsedTelegramUser } from '@/types/telegram';
// ...existing code...
import { Inventory } from '@/domain/inventory/Inventory';
import { ASSETS } from '@/constants/assets';
import { IUserRepository } from '@/application/user/IUserRepository';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
// import { CraftItemUseCase } from '@/application/crafting/CraftItemUseCase';
import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { ShardSystem } from '@/domain/shards/ShardSystem';
// ...existing code...

interface UserState {
  user: User;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  inventoryFetched?: boolean;
}

interface UserActions {
  setUser: (user: User) => void;
  setTelegramUser: (telegramUser: ParsedTelegramUser) => void;
  updateBalance: (amount: number) => void;
  addToInventory: (prize: Prize, fromCase: string) => void;
  receiveInventoryItem: (inventoryItemId: string) => void;
  craftFromShards: (shardKey: string, fromCase?: string) => void;
  sellInventoryItem: (inventoryItemId: string) => void;
  addInventoryItem: (prize: Prize, fromCase: string, status?: 'active' | 'sold' | 'received') => string;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  disconnectWallet: () => void;
  resetUser: () => void;
  loadInventory: () => Promise<void>;
  loadUser: () => Promise<void>;
  saveUser: () => Promise<void>;
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
  shardUpdatedAt: {},
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
    shardUpdatedAt: {},
    lastDrop: null
  };
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  user: defaultUser,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  inventoryFetched: false,

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
      // Обработка осколков — делегируем системе осколков для централизованной логики
      if (prize.isShard && prize.shardKey) {
        const sys = new ShardSystem();
        const nextShards = sys.addShard(state.user.shards || {}, prize.shardKey, 1);
        const now = Date.now();
        return {
          user: {
            ...state.user,
            shards: nextShards,
            shardUpdatedAt: { ...(state.user.shardUpdatedAt || {}), [prize.shardKey]: now },
            lastDrop: { kind: 'shard', id: prize.shardKey }
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

  addInventoryItem: (prize, fromCase, status = 'active') => {
    const inventoryItem: InventoryItem = Inventory.createInventoryItem(prize, fromCase);
    const itemWithStatus: InventoryItem = { ...inventoryItem, status } as InventoryItem;
    set((state) => {
      if (prize.isShard && prize.shardKey) {
        const sys = new ShardSystem();
        const nextShards = sys.addShard(state.user.shards || {}, prize.shardKey, 1);
        const now = Date.now();
        return {
          user: {
            ...state.user,
            shards: nextShards,
            shardUpdatedAt: { ...(state.user.shardUpdatedAt || {}), [prize.shardKey]: now },
            lastDrop: { kind: 'shard', id: prize.shardKey }
          }
        };
      }
      return {
        user: {
          ...state.user,
          inventory: [...state.user.inventory, itemWithStatus],
          lastDrop: { kind: 'item', id: inventoryItem.id }
        }
      };
    });
    return inventoryItem.id;
  },

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
      const sys = new ShardSystem();
      const res = sys.craft(state.user.shards || {}, state.user.shardUpdatedAt || {}, shardKey);
      if (!res) return state;
      const newItem = Inventory.createInventoryItem(res.prize, fromCase || 'Craft');
      return {
        user: {
          ...state.user,
          shards: res.updatedShards,
          shardUpdatedAt: res.updatedShardUpdatedAt,
          inventory: [...state.user.inventory, newItem],
          lastDrop: { kind: 'item', id: newItem.id }
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
    isLoading: false,
    inventoryFetched: false
  }),

  loadInventory: async () => {
    set({ isLoading: true, error: null });
    const repo: IInventoryRepository = RepositoryFactory.getInventoryRepository();
    try {
      const fetched = await repo.fetchInventory('guest');
      set((state) => {
        const existing = state.user.inventory || [];
        // Если репозиторий вернул пусто (например, мок), не затираем локальные предметы
        if (!fetched || fetched.length === 0) {
          return {
            isLoading: false,
            inventoryFetched: true,
            user: { ...state.user, inventory: existing }
          };
        }
        // Объединяем без дубликатов по id, приоритет — локальные предметы
        const existingIds = new Set(existing.map(i => i.id));
        const merged = [...existing, ...fetched.filter(i => !existingIds.has(i.id))];
        return {
          isLoading: false,
          inventoryFetched: true,
          user: { ...state.user, inventory: merged }
        };
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, error: message || 'Failed to load inventory' });
    }
  }
  ,

  loadUser: async () => {
    set({ isLoading: true, error: null });
    const repo: IUserRepository = RepositoryFactory.getUserRepository();
    try {
      const fetched = await repo.fetchUser();
      set((state) => {
        const existingInv = state.user.inventory || [];
        const fetchedInv = fetched.inventory || [];
        const inventory = fetchedInv.length === 0
          ? existingInv
          : (() => {
              const existingIds = new Set(existingInv.map(i => i.id));
              return [...existingInv, ...fetchedInv.filter(i => !existingIds.has(i.id))];
            })();
        return {
          user: { ...fetched, inventory },
          isAuthenticated: true,
          isLoading: false,
          error: null
        };
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, error: message || 'Failed to load user' });
    }
  },

  saveUser: async () => {
    const repo: IUserRepository = RepositoryFactory.getUserRepository();
  const { user } = useUserStore.getState();
    try {
      // Пытаемся сохранить пользователя; при неудаче — мягкий фолбэк (локальное состояние уже обновлено)
      await repo.saveUser(user);
    } catch {
      // no-op for mock
    }
  }
})); 