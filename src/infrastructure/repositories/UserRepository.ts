import { IUserRepository } from '@/application/user/IUserRepository';
import { User } from '@/types/user';
import { apiClient } from '@/services/apiClient';
import { MockUserRepository } from '@/application/user/MockUserRepository';
import { DevLogger } from '@/services/devtools/loggerService';
import { isApiEnabled } from '@/config/api.config';

export class UserRepository implements IUserRepository {
  async fetchUser(): Promise<User> {
    try {
      return await apiClient.get<User>('/api/me');
    } catch (error) {
      DevLogger.logError('Failed to fetch user from API', error);

      // Only fallback to mock if API is disabled or service unavailable
      const shouldFallback = !isApiEnabled() || (error as any)?.status === 503;

      if (shouldFallback) {
        DevLogger.logWarn('Falling back to mock user repository');
        return await new MockUserRepository().fetchUser();
      }

      throw error;
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      await apiClient.post<void>('/api/me', user);
    } catch (error) {
      DevLogger.logError('Failed to save user to API', error);

      // Only ignore errors if API is disabled
      if (!isApiEnabled()) {
        DevLogger.logWarn('API disabled, skipping user save');
        return;
      }

      throw error;
    }
  }

  async fetchAll(): Promise<User[]> {
    // Not used in app, provided for interface completeness
    const me = await this.fetchUser();
    return [me];
  }
}




