import { ISpinGateway, SpinRequest, SpinResponse } from '@/application/roulette/ISpinGateway';
import { ProbabilityCalculator } from '@/domain/roulette/ProbabilityCalculator';
import { apiService } from '@/services/apiService';
import { isApiEnabled } from '@/config/api.config';
import { mapSpinResult } from '@/services/apiMappers';
import { ApiValidator } from '@/infrastructure/validation/validator';
import { SpinRequestSchema, SpinResponseSchema } from '@/infrastructure/validation/schemas';
import { ApiErrorHandler } from '@/infrastructure/errors/ApiErrorHandler';

export class HttpSpinGateway implements ISpinGateway {
  async requestSpin(payload: SpinRequest): Promise<SpinResponse> {
    // Validate request payload
    const validatedPayload = ApiValidator.validate(SpinRequestSchema, payload, 'SpinRequest');

    const forceLocal = (import.meta as any).env?.VITE_FORCE_LOCAL_SPIN === 'true';
    if (!forceLocal && isApiEnabled()) {
      try {
        const apiResult = await apiService.spin(String(validatedPayload.caseId));
        const mapped = mapSpinResult(apiResult as any);

        // Validate response
        const response: SpinResponse = {
          prizeId: mapped.prize.id,
          serverPrize: mapped.prize,
          position: mapped.position,
          raw: apiResult,
          userPatch: apiResult.userPatch
        };

        return ApiValidator.validate(SpinResponseSchema, response, 'SpinResponse');
      } catch (error) {
        // Handle and re-throw with proper error context
        const apiError = ApiErrorHandler.handle(error, {
          endpoint: '/api/spin',
          method: 'POST'
        });
        throw apiError;
      }
    }

    // Local dev mock with same biasing as local ProbabilityCalculator
    const fakePrizes = validatedPayload.items.map(it => ({
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
