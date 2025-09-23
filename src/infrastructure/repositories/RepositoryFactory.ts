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

export class RepositoryFactory {
  static getCaseRepository(): ICaseRepository {
    // In guest/dev mode, prefer mock; otherwise infra
    return (shouldUseGuestMode() ? new MockCaseRepository() : new CaseRepository()) as ICaseRepository;
  }

  static getUserRepository(): IUserRepository {
    return (shouldUseGuestMode() ? new MockUserRepository() : new UserRepository()) as IUserRepository;
  }

  static getInventoryRepository(): IInventoryRepository {
    return (shouldUseGuestMode() ? new MockInventoryRepository() : new InventoryRepository()) as IInventoryRepository;
  }

  static getProductRepository(): IProductRepository {
    // пока только мок
    return new MockProductRepository();
  }
}


