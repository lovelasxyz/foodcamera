import { IBannerRepository } from '@/application/banner/IBannerRepository';
import { ApiBanner } from '@/types/api';
import { apiClient } from '@/services/apiClient';
import { API_CONFIG } from '@/config/api.config';

export class BannerRepository implements IBannerRepository {
  async fetchActive(): Promise<ApiBanner[]> {
    // If backend not ready, this will throw and caller may fallback.
    return apiClient.get<ApiBanner[]>(API_CONFIG.ENDPOINTS.BANNERS);
  }
}
