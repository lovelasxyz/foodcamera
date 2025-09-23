import { apiClient } from '@/services/apiClient';
import { ISpinGateway, SpinRequest, SpinResponse } from '@/application/roulette/ISpinGateway';

export class HttpSpinGateway implements ISpinGateway {
  async requestSpin(payload: SpinRequest): Promise<SpinResponse> {
    try {
      return await apiClient.post<SpinResponse>('/api/spin', payload);
    } catch {
      // Dev mock: choose random item weighted by 1/sqrt(EV)
      const weights = payload.items.map(i => 1 / Math.sqrt(Math.max(1, i.ev)));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let idx = 0; idx < payload.items.length; idx++) {
        r -= weights[idx];
        if (r <= 0) return { prizeId: payload.items[idx].id };
      }
      return { prizeId: payload.items[payload.items.length - 1].id };
    }
  }
}
