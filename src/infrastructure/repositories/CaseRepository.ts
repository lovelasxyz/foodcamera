import { ICaseRepository } from '@/application/case/ICaseRepository';
import { Case } from '@/types/game';
import { apiClient } from '@/services/apiClient';
import { mockCases } from '@/mocks/cases.mock';
import { ApiCase } from '@/types/api';
import { mapApiCase } from '@/application/case/mapApiCase';
import { DevLogger } from '@/services/devtools/loggerService';
import { isApiEnabled } from '@/config/api.config';

export class CaseRepository implements ICaseRepository {
  async fetchAll(): Promise<Case[]> {
    try {
      const apiCases = await apiClient.get<ApiCase[]>('/cases');
      return apiCases.map(mapApiCase);
    } catch (error) {
      DevLogger.logError('Failed to fetch cases from API', error);

      // Only fallback to mock if API is disabled or service unavailable
      const shouldFallback = !isApiEnabled() || (error as any)?.status === 503;

      if (shouldFallback) {
        DevLogger.logWarn('Falling back to mock cases');
        return mockCases;
      }

      throw error;
    }
  }

  async fetchById(id: number): Promise<Case> {
    try {
      const apiCase = await apiClient.get<ApiCase>(`/cases/${id}`);
      return mapApiCase(apiCase);
    } catch (error) {
      DevLogger.logError(`Failed to fetch case ${id} from API`, error);

      // Only fallback to mock if API is disabled or service unavailable
      const shouldFallback = !isApiEnabled() || (error as any)?.status === 503;

      if (shouldFallback) {
        DevLogger.logWarn(`Falling back to mock case ${id}`);
        const found = mockCases.find(c => c.id === id);
        if (!found) throw new Error('Case not found');
        return found;
      }

      throw error;
    }
  }

  getMockCases(): Case[] {
    return mockCases;
  }
}




