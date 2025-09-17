import { Case } from '@/types/game';
import { IRepository } from '@/application/common/IRepository';

export interface ICaseRepository extends IRepository<Case, number> {
  fetchAll(): Promise<Case[]>; // explicit for clarity
  fetchById(id: number): Promise<Case>;
  /**
   * Temporary helper to expose local mock data where needed
   * (used in development/guest mode only).
   */
  getMockCases?(): Case[];
}



