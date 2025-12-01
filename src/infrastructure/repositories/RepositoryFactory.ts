import { shouldUseGuestMode } from '@/utils/environment';
import { isApiEnabled } from '@/config/api.config';
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
import { DevLogger } from '@/services/devtools/loggerService';

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

  private static shouldUseMockRepositories(): boolean {
    const apiEnabled = isApiEnabled();
    const guestMode = shouldUseGuestMode();
    
    // FIXED: If API is enabled, ALWAYS use real repositories
    // Guest mode only affects authentication flow, not data persistence
    // Previously: useMock = !apiEnabled || guestMode (WRONG - mock even with API)
    // Now: useMock = !apiEnabled (CORRECT - mock only if API is disabled)
    const useMock = !apiEnabled;
    
    DevLogger.logInfo('[RepositoryFactory] Repository selection', {
      useMock,
      apiEnabled,
      guestMode,
      reason: useMock 
        ? 'API disabled - using mock repositories' 
        : 'API enabled - using real repositories (even in guest mode)'
    });
    
    return useMock;
  }

  static getCaseRepository(): ICaseRepository {
    if (!this.caseRepo) {
      this.caseRepo = this.shouldUseMockRepositories() ? new MockCaseRepository() : new CaseRepository();
    }
    return this.caseRepo;
  }

  static getUserRepository(): IUserRepository {
    if (!this.userRepo) {
      this.userRepo = this.shouldUseMockRepositories() ? new MockUserRepository() : new UserRepository();
    }
    return this.userRepo;
  }

  static getInventoryRepository(): IInventoryRepository {
    if (!this.inventoryRepo) {
      this.inventoryRepo = this.shouldUseMockRepositories() ? new MockInventoryRepository() : new InventoryRepository();
    }
    return this.inventoryRepo;
  }

  static getProductRepository(): IProductRepository {
    if (!this.productRepo) {
      this.productRepo = this.shouldUseMockRepositories() ? new MockProductRepository() : new ProductRepository();
    }
    return this.productRepo;
  }

  static getBannerRepository(): IBannerRepository {
    if (!this.bannerRepo) {
      this.bannerRepo = this.shouldUseMockRepositories() ? new MockBannerRepository() : new BannerRepository();
    }
    return this.bannerRepo;
  }

  /**
   * Reset all repository instances (useful for testing or environment changes)
   */
  static reset(): void {
    this.caseRepo = undefined;
    this.userRepo = undefined;
    this.inventoryRepo = undefined;
    this.productRepo = undefined;
    this.bannerRepo = undefined;
    DevLogger.logInfo('Repository factory reset');
  }
}