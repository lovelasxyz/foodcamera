import { IUserRepository } from '@/application/user/IUserRepository';
import { User } from '@/types/user';
import { apiClient } from '@/services/apiClient';
import { MockUserRepository } from '@/application/user/MockUserRepository';

export class UserRepository implements IUserRepository {
  async fetchUser(): Promise<User> {
    try {
      return await apiClient.get<User>('/api/me');
    } catch {
      // Fallback to mock until BE is ready
      return await new MockUserRepository().fetchUser();
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      await apiClient.post<void>('/api/me', user);
    } catch {
      // No-op: in dev fallback silently
    }
  }

  async fetchAll(): Promise<User[]> {
    // Not used in app, provided for interface completeness
    const me = await this.fetchUser();
    return [me];
  }
}




