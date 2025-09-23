import { IUserRepository } from './IUserRepository';
import type { User } from '@/types/user';
import { UserFactory } from './UserFactory';

export class MockUserRepository implements IUserRepository {
  async fetchUser(): Promise<User> {
    return UserFactory.createGuest();
  }

  async saveUser(user: User): Promise<void> {
    void user; // mock no-op
  }

  async fetchAll(): Promise<User[]> {
    const me = await this.fetchUser();
    return [me];
  }
}
















