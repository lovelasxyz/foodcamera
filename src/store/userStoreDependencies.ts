import { IUserRepository } from '@/application/user/IUserRepository';
import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { User } from '@/types/user';

export interface ApiServiceContract {
  getCurrentUser(): Promise<User>;
}

export interface UserStoreDependencies {
  getUserRepository: () => IUserRepository;
  getInventoryRepository: () => IInventoryRepository;
  apiService: ApiServiceContract;
  mapUser: (apiUser: any) => User;
}

let dependencies: UserStoreDependencies | null = null;
type DependencyFactory = () => UserStoreDependencies;

const GLOBAL_FALLBACK_KEY = '__USER_STORE_DEPENDENCY_FALLBACK__';

const getGlobal = (): Record<string, unknown> => {
  if (typeof globalThis !== 'undefined') {
    return globalThis as Record<string, unknown>;
  }
  // Should never happen in modern environments, but keeps typing happy
  return {};
};

const getFallbackFactory = (): DependencyFactory | null => {
  const registry = getGlobal();
  return (registry[GLOBAL_FALLBACK_KEY] as DependencyFactory | undefined) ?? null;
};

export const configureUserStoreDependencies = (deps: UserStoreDependencies): void => {
  dependencies = deps;
};

export const registerUserStoreDependencyFallback = (factory: DependencyFactory): void => {
  const registry = getGlobal();
  registry[GLOBAL_FALLBACK_KEY] = factory;
};

export const ensureUserStoreDependenciesConfigured = (): void => {
  if (dependencies) return;
  const fallback = getFallbackFactory();
  if (fallback) {
    dependencies = fallback();
  }
};

export const getUserStoreDependencies = (): UserStoreDependencies => {
  ensureUserStoreDependenciesConfigured();
  if (!dependencies) {
    throw new Error('User store dependencies have not been configured');
  }
  return dependencies;
};
