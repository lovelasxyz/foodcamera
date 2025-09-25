import { ICaseRepository } from '@/application/case/ICaseRepository';
import { Case } from '@/types/game';
import { apiClient } from '@/services/apiClient';
import { mockCases } from '@/mocks/cases.mock';
import { ApiCase } from '@/types/api';
import { mapApiCase } from '@/application/case/mapApiCase';

export class CaseRepository implements ICaseRepository {
  async fetchAll(): Promise<Case[]> {
    try {
      const apiCases = await apiClient.get<ApiCase[]>('/cases');
      return apiCases.map(mapApiCase);
    } catch {
      return mockCases; // fallback
    }
  }

  async fetchById(id: number): Promise<Case> {
    try {
      const apiCase = await apiClient.get<ApiCase>(`/cases/${id}`);
      return mapApiCase(apiCase);
    } catch {
      const found = mockCases.find(c => c.id === id);
      if (!found) throw new Error('Case not found');
      return found;
    }
  }

  getMockCases(): Case[] {
    return mockCases;
  }
}




