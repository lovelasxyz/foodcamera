import { InventoryItem } from '@/types/user';
import { IRepository } from '@/application/common/IRepository';

export interface IInventoryRepository extends IRepository<InventoryItem, string> {
  fetchInventory(userId: string): Promise<InventoryItem[]>;
}


