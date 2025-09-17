import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { InventoryItem } from '@/types/user';
import { apiClient } from '@/services/apiClient';

export class InventoryRepository implements IInventoryRepository {
  async fetchInventory(userId: string): Promise<InventoryItem[]> {
    try {
      return await apiClient.get<InventoryItem[]>(`/api/users/${userId}/inventory`);
    } catch {
      return [];
    }
  }

  async fetchAll(): Promise<InventoryItem[]> {
    // Not used, but aligning with IRepository
    return [];
  }
}




