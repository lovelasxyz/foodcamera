import { IBannerRepository } from './IBannerRepository';
import { ApiBanner } from '@/types/api';

// Simple in-memory mock banners
// Используем реально существующие ассеты из /assets/images (см. constants/assets.ts)
const mockBanners: ApiBanner[] = [
  { id: 1, title: 'Invite friends and earn', image: '/assets/images/dragon.png', priority: 10, isActive: true, link: '#invite' },
  { id: 2, title: 'New Epic Case Released', image: '/assets/images/diamond.png', priority: 8, isActive: true, link: '#new-case' },
  { id: 3, title: 'Open Daily Free Case', image: '/assets/images/free-case.png', priority: 7, isActive: true, link: '#free' }
];

export class MockBannerRepository implements IBannerRepository {
  async fetchActive(): Promise<ApiBanner[]> {
    await new Promise(r => setTimeout(r, 120));
    return mockBanners;
  }
}
