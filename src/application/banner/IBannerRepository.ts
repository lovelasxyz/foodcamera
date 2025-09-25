import { ApiBanner } from '@/types/api';

export interface IBannerRepository {
  fetchActive(): Promise<ApiBanner[]>;
}
