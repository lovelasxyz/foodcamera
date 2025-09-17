import { User } from '@/types/user';
import { IRepository } from '@/application/common/IRepository';

export interface IUserRepository extends IRepository<User, string> {
  fetchUser(): Promise<User>;
  saveUser(user: User): Promise<void>;
}


