import { create } from 'zustand';
import { User } from '@/types/user';
import { Prize } from '@/types/game';
import { ParsedTelegramUser } from '@/types/telegram';
import { IUserRepository } from '@/application/user/IUserRepository';
import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { UserFactory } from '@/application/user/UserFactory';
import { AwardPrizeUseCase } from '@/application/inventory/AwardPrizeUseCase';
import { isApiEnabled } from '@/config/api.config';
import { userStorage } from './userStorage';
import * as helpers from './userHelpers';
import { shouldUseGuestMode } from '@/utils/environment';
import { MockInventoryRepository } from '@/application/inventory/MockInventoryRepository';
import { getUserStoreDependencies, ensureUserStoreDependenciesConfigured } from './userStoreDependencies';
import { OptimisticUpdateFactory } from '@/infrastructure/optimistic/OptimisticUpdateManager';
import { DevLogger } from '@/services/devtools/loggerService';

interface UserState {
  user: User;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  inventoryFetched?: boolean;
  token?: string | null;
  refreshToken?: string | null;
  tokenExpiry?: number | null;
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

ensureUserStoreDependenciesConfigured();

const defaultUser: User = UserFactory.createGuest();
const isDev = typeof window !== 'undefined' && (import.meta as any)?.env?.MODE !== 'production';
const shouldUseDevPersistence = isDev && !isApiEnabled();

// Hydrate initial state
// Force read from storage to ensure we get the latest token
const initialToken = userStorage.getToken();
DevLogger.logInfo('[UserStore] Initial token from storage:', { token: initialToken });
const devSnapshot = shouldUseDevPersistence ? userStorage.getDevSnapshot<Partial<User>>() : null;
const persistedBalance = userStorage.getBalance();

// Clear persisted balance when API is enabled - server is source of truth
if (isApiEnabled() && persistedBalance != null) {
  DevLogger.logInfo('[UserStore] Clearing persisted balance - API is enabled', { persistedBalance });
  userStorage.clearBalance();
}

const initialUser = (() => {
  if (devSnapshot) {
    DevLogger.logInfo('[UserStore] Using dev snapshot for initial user', { balance: devSnapshot.balance });
    return { ...defaultUser, ...devSnapshot, inventory: devSnapshot.inventory || [] } as User;
  }
  // Only use persisted balance if we are NOT using API (otherwise API is source of truth)
  if (persistedBalance != null && !isApiEnabled()) {
    DevLogger.logInfo('[UserStore] Using persisted balance for initial user', { balance: persistedBalance });
    return { ...defaultUser, balance: persistedBalance } as User;
  }
  DevLogger.logInfo('[UserStore] Using default user', { balance: defaultUser.balance, isApiEnabled: isApiEnabled() });
  return defaultUser;
})();

// Optimistic update manager available for future use
// Usage: const manager = getOptimisticManager();
export const getOptimisticManager = () => {
  return OptimisticUpdateFactory.forStore<UserState & UserActions>(
    () => useUserStore.getState(),
    (updater) => useUserStore.setState(updater)
  );
};

export const useUserStore = create<UserState & UserActions>((set, get) => ({
  user: initialUser,
  isLoading: false,
  error: null,
  isAuthenticated: !!initialToken, // If we have a token, we are tentatively authenticated
  inventoryFetched: false,
  token: initialToken,
  refreshToken: null,
  tokenExpiry: null,

  setUser: (user) => set({ user, isAuthenticated: true, error: null }),

  setTelegramUser: (telegramUser) => {
    const user = UserFactory.createFromTelegram(telegramUser);
    set({ user, isAuthenticated: true, error: null, isLoading: false });
  },

  setToken: (token) => {
    DevLogger.logInfo('[UserStore] Setting token:', { token });
    userStorage.setToken(token);
    set({ token });
  },

  setTokenMeta: (refreshToken?: string | null, expiresInSec?: number | null) => {
    set({
      refreshToken: refreshToken ?? null,
      tokenExpiry: expiresInSec ? Date.now() + expiresInSec * 1000 : null
    });
  },

  updateBalance: (amount) =>
    set((state) => ({ user: helpers.updateUserBalance(state.user, amount) })),

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
      // Handle inventory from server - replace local inventory with server's authoritative data
      if (Array.isArray(patch.inventory)) {
        next.inventory = patch.inventory;
        DevLogger.logInfo('[UserStore.applyServerUserPatch] Inventory updated from server', { 
          count: patch.inventory.length 
        });
      }
      for (const k of Object.keys(patch)) {
        if (k === 'balance' || k === 'stats' || k === 'inventory') continue;
        const v = (patch as any)[k];
        if (v == null) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          (next as any)[k] = v;
        }
      }
      DevLogger.logInfo('[UserStore.applyServerUserPatch] Applied patch', { 
        balance: next.balance, 
        inventoryCount: next.inventory?.length 
      });
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
      })),
      (amount) => set((state) => ({ user: helpers.updateUserBalance(state.user, amount) }))
    );
    void useCase.award(prize, fromCase);
  },

  addToInventory: (prize, fromCase) => {
    get().addInventoryItem(prize, fromCase, 'active');
  },

  addInventoryItem: (prize, fromCase, status = 'active') => {
    let itemId = '';
    set((state) => {
      const result = helpers.addInventoryItemToUser(state.user, prize, fromCase, status);
      itemId = result.itemId;
      return { user: result.user };
    });
    return itemId;
  },

  receiveInventoryItem: (itemId) =>
    set((state) => ({ user: helpers.receiveInventoryItem(state.user, itemId) })),

  sellInventoryItem: (itemId) =>
    set((state) => ({ user: helpers.sellInventoryItem(state.user, itemId) })),

  craftFromShards: (shardKey, fromCase) =>
    set((state) => ({ user: helpers.craftFromShards(state.user, shardKey, fromCase) })),

  incrementSpinsCount: () =>
    set((state) => ({ user: helpers.incrementSpins(state.user) })),

  setLastAuthNow: () =>
    set((state) => ({ user: helpers.setLastAuthNow(state.user) })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  disconnectWallet: () =>
    set((state) => {
      if (shouldUseDevPersistence) {
        userStorage.clearDevSnapshot();
      }
      userStorage.clearBalance();
      return { user: helpers.disconnectWallet(state.user, shouldUseDevPersistence) };
    }),

  resetUser: () => set({
    user: defaultUser,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    inventoryFetched: false
  }),

  loadInventory: async () => {
    set({ isLoading: true, error: null });
    
    if (shouldUseGuestMode() && !isApiEnabled()) {
      try {
        const fetched = await new MockInventoryRepository().fetchInventory('guest');
        set((state) => ({
          isLoading: false,
          inventoryFetched: true,
          user: { ...state.user, inventory: helpers.mergeInventory(state.user.inventory, fetched) }
        }));
        return;
      } catch (e) {
        set({ isLoading: false, error: 'Failed to load guest inventory' });
        return;
      }
    }

    const { getInventoryRepository } = getUserStoreDependencies();
    const repo: IInventoryRepository = getInventoryRepository();
    try {
      const fetched = await repo.fetchInventory('guest');
      set((state) => ({
        isLoading: false,
        inventoryFetched: true,
        user: { ...state.user, inventory: helpers.mergeInventory(state.user.inventory, fetched) }
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, error: message || 'Failed to load inventory' });
    }
  },

  loadUser: async () => {
    set({ isLoading: true, error: null });

    if (shouldUseGuestMode() && !isApiEnabled()) {
      // In guest mode without API, we rely on data from localStorage
      // Don't overwrite with a fresh mock user!
      DevLogger.logInfo('[UserStore.loadUser] Guest mode without API - using stored data', {});
      set({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        inventoryFetched: true
      });
      return;
    }

    const { apiService, getUserRepository, mapUser } = getUserStoreDependencies();
    const repo: IUserRepository = getUserRepository();
    try {
      const fetchedRaw = isApiEnabled() ? await apiService.getCurrentUser() : await repo.fetchUser();
      DevLogger.logInfo('[UserStore.loadUser] Raw API response:', { data: fetchedRaw });
      const fetched = isApiEnabled() ? mapUser(fetchedRaw as any) : fetchedRaw;
      DevLogger.logInfo('[UserStore.loadUser] Mapped user:', { data: fetched });
      DevLogger.logInfo('[UserStore.loadUser] Balance from API:', { balance: fetched.balance });
      set((state) => {
        // If we are using API, we should trust the API inventory, but merge if needed
        // For now, let's overwrite inventory from API if it's empty locally or just trust API
        const inventory = fetched.inventory || [];
        const newUser = { ...fetched, inventory };
        DevLogger.logInfo('[UserStore.loadUser] Setting user in store:', { 
          newBalance: newUser.balance,
          prevBalance: state.user.balance,
          newInventoryCount: newUser.inventory?.length,
          prevInventoryCount: state.user.inventory?.length
        });
        return {
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
          error: null
        };
      });
      // Also trigger inventory load separately if needed, but usually user profile has it
      if (isApiEnabled()) {
         // Ensure inventory is marked as fetched
         set({ inventoryFetched: true });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, error: message || 'Failed to load user' });
    }
  },

  saveUser: async () => {
    const { getUserRepository } = getUserStoreDependencies();
    const repo: IUserRepository = getUserRepository();
    const { user } = get();
    try {
      await repo.saveUser(user);
    } catch {
      // no-op for mock
    }
  }
}));

// Subscribe for persistence
if (typeof window !== 'undefined') {
  useUserStore.subscribe((state, prev) => {
    // Always ensure token is synced if it exists in state but not in storage (edge case)
    if (state.token && !userStorage.getToken()) {
       userStorage.setToken(state.token);
    } else if (state.token !== prev.token) {
      userStorage.setToken(state.token ?? null);
    }

    // Only persist balance to localStorage if API is DISABLED
    // When API is enabled, server is the source of truth for balance
    if (!isApiEnabled() && state.user.balance !== prev.user.balance) {
      userStorage.setBalance(state.user.balance);
    }

    if (shouldUseDevPersistence && (state.user.balance !== prev.user.balance || state.user.inventory !== prev.user.inventory)) {
      const inv = state.user.inventory || [];
      const MAX_ITEMS = 500;
      const trimmed = inv.length > MAX_ITEMS ? inv.slice(inv.length - MAX_ITEMS) : inv;
      userStorage.setDevSnapshot({
        balance: state.user.balance,
        inventory: trimmed,
        stats: state.user.stats,
        shards: state.user.shards,
        shardUpdatedAt: state.user.shardUpdatedAt
      });
    }
  });
}
