import { create } from 'zustand';
import { User, InventoryItem } from '@/types/user';
import { Prize } from '@/types/game';
import { ParsedTelegramUser } from '@/types/telegram';
import { Inventory } from '@/domain/inventory/Inventory';
import { IUserRepository } from '@/application/user/IUserRepository';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { ShardSystem } from '@/domain/shards/ShardSystem';

interface UserState {
  user: User;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  inventoryFetched?: boolean;
  token?: string | null;
  refreshToken?: string | null;
  tokenExpiry?: number | null; // epoch ms
}

interface UserActions {
  setUser: (user: User) => void;
  setTelegramUser: (telegramUser: ParsedTelegramUser) => void;
  setToken: (token: string | null) => void;
  setTokenMeta?: (refreshToken?: string | null, expiresInSec?: number | null) => void;
  updateBalance: (amount: number) => void;
  applyServerUserPatch: (patch: { balance?: number; stats?: { spinsCount?: number; lastAuthAt?: number | null }; [k: string]: unknown }) => void;
  awardPrize: (prize: Prize, fromCase: string) => void;
  addToInventory: (prize: Prize, fromCase: string) => void;
  receiveInventoryItem: (inventoryItemId: string) => void;
  craftFromShards: (shardKey: string, fromCase?: string) => void;
  sellInventoryItem: (inventoryItemId: string) => void;
  addInventoryItem: (prize: Prize, fromCase: string, status?: 'active' | 'sold' | 'received') => string;
  incrementSpinsCount: () => void;
  setLastAuthNow: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  disconnectWallet: () => void;
  resetUser: () => void;
  loadInventory: () => Promise<void>;
  loadUser: () => Promise<void>;
  saveUser: () => Promise<void>;
}

import { UserFactory } from '@/application/user/UserFactory';
// Дефолтный пользователь (fallback)
const defaultUser: User = UserFactory.createGuest();

// Функция для преобразования Telegram пользователя в пользователя приложения
const createUserFromTelegram = (telegramUser: ParsedTelegramUser): User => UserFactory.createFromTelegram(telegramUser);

import { AwardPrizeUseCase } from '@/application/inventory/AwardPrizeUseCase';
import { apiService } from '@/services/apiService';
import { isApiEnabled } from '@/config/api.config';
import { mapUser } from '@/services/apiMappers';

// Local storage key for auth token
const TOKEN_STORAGE_KEY = 'app_token_v1';
const BALANCE_STORAGE_KEY = 'user_balance_v1';

// Attempt immediate token hydrate (safe for SSR-less environment)
let initialToken: string | null = null;
try {
  if (typeof window !== 'undefined') {
    initialToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  }
} catch { /* ignore storage access errors */ }

// Dev local snapshot keys
const DEV_USER_SNAPSHOT_KEY = 'dev_user_snapshot_v1';

// Helper: detect dev & mocks (no real API authority)
const isDev = typeof window !== 'undefined' && (import.meta as any)?.env?.MODE !== 'production';
const shouldUseDevPersistence = isDev && !isApiEnabled();

// Attempt dev hydrate
let devHydratedUser: Partial<User> | null = null;
let persistedBalance: number | null = null;
if (shouldUseDevPersistence) {
  try {
    const raw = window.localStorage.getItem(DEV_USER_SNAPSHOT_KEY);
    if (raw) devHydratedUser = JSON.parse(raw);
  } catch { /* ignore */ }
}
// Read persisted balance (works for all modes). In dev snapshot mode we let snapshot win.
try {
  if (typeof window !== 'undefined') {
    const b = window.localStorage.getItem(BALANCE_STORAGE_KEY);
    if (b != null) {
      const num = Number(b);
      if (Number.isFinite(num) && num >= 0) persistedBalance = num;
    }
  }
} catch { /* ignore */ }

export const useUserStore = create<UserState & UserActions>((set, get) => ({
  user: (() => {
    if (devHydratedUser) {
      // dev snapshot already has balance; do not override
      return { ...defaultUser, ...devHydratedUser, inventory: devHydratedUser.inventory || [] } as User;
    }
    if (persistedBalance != null) {
      return { ...defaultUser, balance: persistedBalance } as User;
    }
    return defaultUser;
  })(),
  isLoading: false,
  error: null,
  isAuthenticated: false,
  inventoryFetched: false,
  token: initialToken,
  refreshToken: null,
  tokenExpiry: null,

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

  setToken: (token) => {
    try {
      if (typeof window !== 'undefined') {
        if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch { /* ignore quota / privacy errors */ }
    set({ token });
  },

  // internal helpers for future refresh flow
  setTokenMeta: (refreshToken?: string | null, expiresInSec?: number | null) => {
    set(() => ({
      refreshToken: refreshToken ?? null,
      tokenExpiry: expiresInSec ? Date.now() + expiresInSec * 1000 : null
    }));
  },

  updateBalance: (amount) => 
    set((state) => ({
      user: {
        ...state.user,
        balance: Math.max(0, state.user.balance + amount)
      }
    })),

  applyServerUserPatch: (patch) =>
    set((state) => {
      const next = { ...state.user } as User & { stats?: any };
      if (typeof patch.balance === 'number' && Number.isFinite(patch.balance)) {
        next.balance = Math.max(0, patch.balance);
      }
      if (patch.stats) {
        const prevStats = next.stats || { spinsCount: 0, lastAuthAt: null };
        next.stats = {
          ...prevStats,
          ...('spinsCount' in patch.stats ? { spinsCount: patch.stats.spinsCount } : {}),
          ...('lastAuthAt' in patch.stats ? { lastAuthAt: patch.stats.lastAuthAt } : {})
        };
      }
      // Merge any other simple scalar fields (defensive for future backend patches)
      for (const k of Object.keys(patch)) {
        if (k === 'balance' || k === 'stats') continue;
        const v = (patch as any)[k];
        if (v == null) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          (next as any)[k] = v;
        }
      }
      return { user: next };
    }),

  awardPrize: (prize, fromCase) => {
    const useCase = new AwardPrizeUseCase(
      () => get().user.inventory,
      (item) => set((state) => ({
        user: { ...state.user, inventory: [...state.user.inventory, item], lastDrop: { kind: 'item', id: item.id } }
      })),
      (key) => get().user.shards?.[key] || 0,
      (key, newCount) => set((state) => ({
        user: {
          ...state.user,
          shards: { ...(state.user.shards || {}), [key]: newCount },
          shardUpdatedAt: { ...(state.user.shardUpdatedAt || {}), [key]: Date.now() },
          lastDrop: { kind: 'shard', id: key }
        }
      }))
    );
    void useCase.award(prize, fromCase);
  },

  addToInventory: (prize, fromCase) => {
    get().addInventoryItem(prize, fromCase, 'active');
  },

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

  incrementSpinsCount: () =>
    set((state) => {
      // Рекламщик: без статистики
      if (state.user.status === 'advertiser') return state;
      const prev = state.user.stats?.spinsCount ?? 0;
      const nextStats = { ...(state.user.stats || { spinsCount: 0, lastAuthAt: null }), spinsCount: prev + 1 };
      return { user: { ...state.user, stats: nextStats } };
    }),

  setLastAuthNow: () =>
    set((state) => {
      const nextStats = { ...(state.user.stats || { spinsCount: 0, lastAuthAt: null }), lastAuthAt: Date.now() };
      return { user: { ...state.user, stats: nextStats } };
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
      if (target.prize.nonRemovableGift) return state;
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
    set((state) => {
      // Очистка dev снапшота (баланс + инвентарь) при отключении кошелька в режиме dev без API
      try {
        if (shouldUseDevPersistence) {
          window.localStorage.removeItem(DEV_USER_SNAPSHOT_KEY);
        }
        window.localStorage.removeItem(BALANCE_STORAGE_KEY);
      } catch { /* ignore */ }
      return {
        user: {
          ...state.user,
          wallet: undefined,
          // Также обнулим баланс и инвентарь только в dev persist режиме (чтобы симулировать чистый старт)
          ...(shouldUseDevPersistence ? { balance: 0, inventory: [], shards: {}, shardUpdatedAt: {} } : {})
        }
      };
    }),

  // DEV helper: clear local snapshot when explicitly disconnecting wallet (only in dev & mocks)
  // (Placed after disconnectWallet for clarity)
  // We'll override disconnectWallet to also clear snapshot if dev persistence active.

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
  const fetchedRaw = isApiEnabled() ? await apiService.getCurrentUser() : await repo.fetchUser();
  const fetched = isApiEnabled() ? mapUser(fetchedRaw as any) : fetchedRaw; // ensure domain shape
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

// Subscribe for dev persistence
if (typeof window !== 'undefined') {
  useUserStore.subscribe((state, prev) => {
    // Persist balance always
    if (state.user.balance !== prev.user.balance) {
      try { window.localStorage.setItem(BALANCE_STORAGE_KEY, String(state.user.balance)); } catch { /* ignore */ }
    }
    // Dev snapshot logic (inventory + balance + shards) only when enabled
    if (shouldUseDevPersistence && (state.user.balance !== prev.user.balance || state.user.inventory !== prev.user.inventory)) {
      try {
        const MAX_ITEMS = 500;
        const inv = state.user.inventory || [];
        const trimmed = inv.length > MAX_ITEMS ? inv.slice(inv.length - MAX_ITEMS) : inv;
        const snapshot = {
          balance: state.user.balance,
          inventory: trimmed,
          stats: state.user.stats,
          shards: state.user.shards,
          shardUpdatedAt: state.user.shardUpdatedAt
        };
        window.localStorage.setItem(DEV_USER_SNAPSHOT_KEY, JSON.stringify(snapshot));
      } catch { /* ignore quota */ }
    }
  });
}