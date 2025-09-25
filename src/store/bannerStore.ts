import { create } from 'zustand';
import { IBannerRepository } from '@/application/banner/IBannerRepository';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { ApiBanner } from '@/types/api';

interface BannerState {
  banners: ApiBanner[];
  isLoading: boolean;
  error: string | null;
}

interface BannerActions {
  loadBanners: () => Promise<void>;
  setBanners: (b: ApiBanner[]) => void;
  setError: (e: string | null) => void;
}

export const useBannerStore = create<BannerState & BannerActions>((set) => ({
  banners: [],
  isLoading: false,
  error: null,
  setBanners: (b) => set({ banners: b }),
  setError: (e) => set({ error: e }),
  loadBanners: async () => {
    set({ isLoading: true, error: null });
    const repo: IBannerRepository = RepositoryFactory.getBannerRepository();
    try {
      const data = await repo.fetchActive();
      set({ banners: data, isLoading: false });
    } catch (e: unknown) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Failed to load banners' });
    }
  }
}));
