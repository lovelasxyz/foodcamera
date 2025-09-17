import { IUserRepository } from './IUserRepository';
import { User } from '@/types/user';
import { ASSETS } from '@/constants/assets';

export class MockUserRepository implements IUserRepository {
  async fetchUser(): Promise<User> {
    await new Promise((r) => setTimeout(r, 120));
    return {
      id: 'guest',
      name: 'Guest User',
      avatar: ASSETS.IMAGES.AVATAR,
      balance: 100,
      wallet: undefined,
      inventory: [],
      shards: {},
      shardUpdatedAt: {},
      lastDrop: null
    };
  }

  async saveUser(user: User): Promise<void> {
    void user;
    await new Promise((r) => setTimeout(r, 60));
  }

  async fetchAll(): Promise<User[]> {
    const me = await this.fetchUser();
    return [me];
  }
}


