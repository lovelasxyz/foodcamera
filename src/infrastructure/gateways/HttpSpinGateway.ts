import { apiClient } from '@/services/apiClient';
import { ISpinGateway, SpinRequest, SpinResponse } from '@/application/roulette/ISpinGateway';
import { ProbabilityCalculator } from '@/domain/roulette/ProbabilityCalculator';

export class HttpSpinGateway implements ISpinGateway {
  async requestSpin(payload: SpinRequest): Promise<SpinResponse> {
    try {
      return await apiClient.post<SpinResponse>('/api/spin', payload);
    } catch {
      // Dev mock with same biasing as local ProbabilityCalculator
      const fakePrizes = payload.items.map(it => ({
        id: it.id,
        price: Math.max(1, it.ev),
        rarity: it.rarity ?? 'common',
        name: String(it.id),
        image: '',
      } as any));
      const probs = ProbabilityCalculator.calculateProbabilities(fakePrizes);
      let r = Math.random();
      let chosen = probs[probs.length - 1].id;
      for (const e of probs) {
        if ((r -= e.p) <= 0) { chosen = e.id; break; }
      }
      return { prizeId: chosen };
    }
  }
}
