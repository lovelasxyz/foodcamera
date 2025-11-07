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
    DevLogger.logInfo('[CaseRepository] fetchAll started', { isApiEnabled: isApiEnabled() });

    try {
      const apiCases = await apiClient.get<ApiCase[]>('/cases');
      DevLogger.logInfo('[CaseRepository] fetchAll success', { count: apiCases.length });
      return apiCases.map(mapApiCase);
    } catch (error) {
      const errorStatus = (error as any)?.status;
      const errorMessage = (error as any)?.message;
      const isApiCurrentlyEnabled = isApiEnabled();

      DevLogger.logError('[CaseRepository] Failed to fetch cases from API', error, {
        errorStatus,
        errorMessage,
        isApiEnabled: isApiCurrentlyEnabled,
        errorType: error?.constructor?.name
      });

      // Only fallback to mock if API is disabled or service unavailable
      const shouldFallback = !isApiCurrentlyEnabled || errorStatus === 503;

      DevLogger.logInfo('[CaseRepository] Fallback decision', {
        shouldFallback,
        reason: shouldFallback ? (!isApiCurrentlyEnabled ? 'API disabled' : 'Service unavailable (503)') : 'Will throw error'
      });

      if (shouldFallback) {
        DevLogger.logWarn('[CaseRepository] Falling back to mock cases');
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




