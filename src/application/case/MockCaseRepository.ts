import { ICaseRepository } from './ICaseRepository';
import { Case } from '@/types/game';
import { mockCases } from '@/mocks/cases.mock';

export class MockCaseRepository implements ICaseRepository {
  async fetchAll(): Promise<Case[]> {
    // Simulate small latency
    await new Promise((r) => setTimeout(r, 150));
    return mockCases;
  }

  async fetchById(id: number): Promise<Case> {
    await new Promise((r) => setTimeout(r, 80));
    const found = mockCases.find(c => c.id === id);
    if (!found) throw new Error('Case not found');
    return found;
  }

  getMockCases(): Case[] {
    return mockCases;
  }
}



