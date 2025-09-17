import { IInventoryRepository } from './IInventoryRepository';
import { InventoryItem } from '@/types/user';

export class MockInventoryRepository implements IInventoryRepository {
  async fetchInventory(userId: string): Promise<InventoryItem[]> {
    void userId;
    await new Promise((r) => setTimeout(r, 120));
    return [];
  }

  async fetchAll(): Promise<InventoryItem[]> {
    return [];
  }
}


