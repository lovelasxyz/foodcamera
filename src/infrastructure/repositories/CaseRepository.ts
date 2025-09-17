import { ICaseRepository } from '@/application/case/ICaseRepository';
import { Case } from '@/types/game';
import { apiClient } from '@/services/apiClient';
import { mockCases } from '@/mocks/cases.mock';

export class CaseRepository implements ICaseRepository {
  async fetchAll(): Promise<Case[]> {
    // Replace '/api/cases' with real endpoint when backend is ready
    try {
      return await apiClient.get<Case[]>('/api/cases');
    } catch {
      // Fallback to mock for resilience in dev
      return mockCases;
    }
  }

  async fetchById(id: number): Promise<Case> {
    try {
      return await apiClient.get<Case>(`/api/cases/${id}`);
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




