import { IInventoryRepository } from '@/application/inventory/IInventoryRepository';
import { InventoryItem } from '@/types/user';
import { apiClient } from '@/services/apiClient';
import { DevLogger } from '@/services/devtools/loggerService';
import { isApiEnabled } from '@/config/api.config';

export class InventoryRepository implements IInventoryRepository {
  async fetchInventory(userId: string): Promise<InventoryItem[]> {
    try {
      return await apiClient.get<InventoryItem[]>(`/users/${userId}/inventory`);
    } catch (error) {
      DevLogger.logError('Failed to fetch inventory from API', error);

      // Only return empty array if API is disabled or service unavailable
      const shouldFallback = !isApiEnabled() || (error as any)?.status === 503;

      if (shouldFallback) {
        DevLogger.logWarn('Falling back to empty inventory');
        return [];
      }

      throw error;
    }
  }

  async fetchAll(): Promise<InventoryItem[]> {
    // Not used, but aligning with IRepository
    return [];
  }
}




