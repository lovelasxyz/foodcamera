import { shouldUseGuestMode } from '@/utils/environment';
import { ICaseRepository } from '@/application/case/ICaseRepository';
import { IUserRepository } from '@/application/user/IUserRepository';
import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { MockCaseRepository } from '@/application/case/MockCaseRepository';
import { MockUserRepository } from '@/application/user/MockUserRepository';
import { MockInventoryRepository } from '@/application/inventory/MockInventoryRepository';
import { CaseRepository } from './CaseRepository';
import { UserRepository } from './UserRepository';
import { InventoryRepository } from './InventoryRepository';
import { IProductRepository } from '@/application/product/IProductRepository';
import { MockProductRepository } from '@/application/product/MockProductRepository';
import { ProductRepository } from './ProductRepository';
import { IBannerRepository } from '@/application/banner/IBannerRepository';
import { MockBannerRepository } from '@/application/banner/MockBannerRepository';
import { BannerRepository } from './BannerRepository';

/**
 * Singleton Factory for repositories
 * Uses lazy initialization to create instances only once
 */
export class RepositoryFactory {
  private static caseRepo?: ICaseRepository;
  private static userRepo?: IUserRepository;
  private static inventoryRepo?: IInventoryRepository;
  private static productRepo?: IProductRepository;
  private static bannerRepo?: IBannerRepository;

  static getCaseRepository(): ICaseRepository {
    if (!this.caseRepo) {
      this.caseRepo = shouldUseGuestMode() ? new MockCaseRepository() : new CaseRepository();
    }
    return this.caseRepo;
  }

  static getUserRepository(): IUserRepository {
    if (!this.userRepo) {
      this.userRepo = shouldUseGuestMode() ? new MockUserRepository() : new UserRepository();
    }
    return this.userRepo;
  }

  static getInventoryRepository(): IInventoryRepository {
    if (!this.inventoryRepo) {
      this.inventoryRepo = shouldUseGuestMode() ? new MockInventoryRepository() : new InventoryRepository();
    }
    return this.inventoryRepo;
  }

  static getProductRepository(): IProductRepository {
    if (!this.productRepo) {
      this.productRepo = shouldUseGuestMode() ? new MockProductRepository() : new ProductRepository();
    }
    return this.productRepo;
  }

  static getBannerRepository(): IBannerRepository {
    if (!this.bannerRepo) {
      this.bannerRepo = shouldUseGuestMode() ? new MockBannerRepository() : new BannerRepository();
    }
    return this.bannerRepo;
  }
}
