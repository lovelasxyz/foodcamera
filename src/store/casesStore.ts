import { create } from 'zustand';
import { Case } from '@/types/game';
import { ICaseRepository } from '@/application/case/ICaseRepository';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';

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
  loadCases: () => Promise<void>;
}

export const useCasesStore = create<CasesState & CasesActions>((set) => ({
  cases: [],
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

  setError: (error) => set({ error }),

  loadCases: async () => {
    set({ isLoading: true, error: null });
    const repository: ICaseRepository = RepositoryFactory.getCaseRepository();
    try {
      const cases = await repository.fetchAll();
      set({ cases, isLoading: false, error: null });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ isLoading: false, error: message || 'Failed to load cases' });
    }
  }
})); 