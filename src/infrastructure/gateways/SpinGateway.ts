import { IRepository } from '@/application/common/IRepository';
import { apiService } from '@/services/apiService';
import { ApiSpinResult } from '@/types/api';

export interface SpinRequest { caseId: string }

// Minimal gateway wrapping apiService for future extensibility
export class SpinGateway implements IRepository<ApiSpinResult, string> {
  async fetchAll(): Promise<ApiSpinResult[]> { return []; }
  async create?(item: ApiSpinResult): Promise<ApiSpinResult> { return item; }
  async spin(caseId: string): Promise<ApiSpinResult> {
    return apiService.spin(caseId);
  }
}

export const spinGateway = new SpinGateway();
