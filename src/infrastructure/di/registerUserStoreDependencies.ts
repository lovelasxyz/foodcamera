import { configureUserStoreDependencies, registerUserStoreDependencyFallback } from '@/store/userStoreDependencies';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { apiService } from '@/services/apiService';
import { mapUser } from '@/services/apiMappers';

const buildDependencies = () => ({
  getUserRepository: () => RepositoryFactory.getUserRepository(),
  getInventoryRepository: () => RepositoryFactory.getInventoryRepository(),
  apiService,
  mapUser
});

registerUserStoreDependencyFallback(buildDependencies);
configureUserStoreDependencies(buildDependencies());
