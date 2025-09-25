import { create } from 'zustand';
import { ApiDeposit } from '@/types/api';
import { apiService } from '@/services/apiService';
import { isApiEnabled } from '@/config/api.config';
import { useUserStore } from '@/store/userStore';

interface DepositState {
  deposits: ApiDeposit[];
  isLoading: boolean;
  error: string | null;
}

interface DepositActions {
  createDeposit: (amount: number) => Promise<void>;
  markConfirmed: (id: string) => void;
  markFailed: (id: string, reason?: string) => void;
  hydrateMockConfirmation: (id: string) => void;
}

export const useDepositStore = create<DepositState & DepositActions>((set, get) => ({
  deposits: [],
  isLoading: false,
  error: null,

  async createDeposit(amount: number) {
    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      if (!isApiEnabled()) {
        // mock: create pending then auto-confirm
        const temp: ApiDeposit = { id: `mock-${now}`, amount, currency: 'USDT', status: 'pending', createdAt: now, updatedAt: now };
        set(state => ({ deposits: [temp, ...state.deposits], isLoading: false }));
        // simulate async confirmation (markConfirmed already credits balance once)
        setTimeout(() => {
          useDepositStore.getState().markConfirmed(temp.id);
        }, 400);
        return;
      }
  const clientDepositId = (crypto as any).randomUUID?.() || `dep-${now}-${Math.random().toString(36).slice(2,10)}`;
  const created = await apiService.createDeposit({ amount, currency: 'USDT', clientDepositId });
      set(state => ({ deposits: [created, ...state.deposits], isLoading: false }));
      // Do NOT credit balance yet; wait for confirmation webhook/poll -> markConfirmed()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, error: message || 'Deposit failed' });
    }
  },

  markConfirmed(id: string) {
    set(state => {
      const idx = state.deposits.findIndex(d => d.id === id);
      if (idx === -1) return state;
      const dep = state.deposits[idx];
      if (dep.status === 'confirmed') return state;
      const updated: ApiDeposit = { ...dep, status: 'confirmed', updatedAt: Date.now() };
      const deposits = [...state.deposits];
      deposits[idx] = updated;
      // Authoritatively credit once
      useUserStore.getState().updateBalance(dep.amount);
      return { deposits };
    });
  },

  markFailed(id: string, reason?: string) {
    set(state => {
      const idx = state.deposits.findIndex(d => d.id === id);
      if (idx === -1) return state;
      const dep = state.deposits[idx];
      if (dep.status === 'failed') return state;
      const updated: ApiDeposit = { ...dep, status: 'failed', updatedAt: Date.now() } as ApiDeposit;
      const deposits = [...state.deposits];
      deposits[idx] = updated;
      return { deposits, error: reason || state.error };
    });
  },

  hydrateMockConfirmation(id: string) {
    get().markConfirmed(id);
  }
}));

export default useDepositStore;