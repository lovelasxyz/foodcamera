import { ISpinGateway, SpinRequest, SpinResponse } from '@/application/roulette/ISpinGateway';
import { ProbabilityCalculator } from '@/domain/roulette/ProbabilityCalculator';
import { apiService } from '@/services/apiService';
import { isApiEnabled } from '@/config/api.config';
import { ApiValidator } from '@/infrastructure/validation/validator';
import { SpinRequestSchema, SpinResponseSchema } from '@/infrastructure/validation/schemas';
import { ApiErrorHandler } from '@/infrastructure/errors/ApiErrorHandler';

type ServerPrizeDto = {
  id?: number | string;
  Id?: number | string;
  prizeId?: number | string;
  PrizeId?: number | string;
  name?: string;
  Name?: string;
  price?: number | string;
  Price?: number | string;
  amount?: number | string;
  Amount?: number | string;
  rarity?: string;
  Rarity?: string;
  image?: string;
  Image?: string;
  imageUrl?: string;
  ImageUrl?: string;
};

type ServerSpinResultDto = {
  prize?: ServerPrizeDto;
  Prize?: ServerPrizeDto;
  userBalance?: number | string;
  UserBalance?: number | string;
};

const rarityValues = ['common', 'rare', 'epic', 'legendary'] as const;

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizePrize = (raw?: ServerPrizeDto): { id: number; name?: string; price?: number; rarity?: typeof rarityValues[number]; image?: string } | null => {
  if (!raw) {
    return null;
  }

  const id = toNumber(raw.id ?? raw.Id ?? raw.prizeId ?? raw.PrizeId);
  if (typeof id !== 'number') {
    return null;
  }

  const rarityRaw = (raw.rarity ?? raw.Rarity ?? '').toString().toLowerCase();
  const rarity = rarityValues.includes(rarityRaw as any) ? rarityRaw as typeof rarityValues[number] : undefined;
  const price = toNumber(raw.price ?? raw.Price ?? raw.amount ?? raw.Amount);
  const image = raw.image ?? raw.Image ?? raw.imageUrl ?? raw.ImageUrl;
  const name = raw.name ?? raw.Name;

  return {
    id,
    name,
    price,
    rarity,
    image
  };
};

const normalizeSpinResponse = (dto: ServerSpinResultDto): SpinResponse => {
  const prize = normalizePrize(dto.prize ?? dto.Prize);
  if (!prize) {
    throw new Error('Spin result is missing prize payload');
  }

  const balance = toNumber(dto.userBalance ?? dto.UserBalance);
  const userPatch = typeof balance === 'number' ? { balance } : undefined;

  return {
    prizeId: prize.id,
    serverPrize: prize,
    userPatch,
    raw: dto
  };
};

export class HttpSpinGateway implements ISpinGateway {
  async requestSpin(payload: SpinRequest): Promise<SpinResponse> {
    // Validate request payload
    const validatedPayload = ApiValidator.validate(SpinRequestSchema, payload, 'SpinRequest');

    const forceLocal = (import.meta as any).env?.VITE_FORCE_LOCAL_SPIN === 'true';
    if (!forceLocal && isApiEnabled()) {
      try {
        const apiResult = await apiService.spin(String(validatedPayload.caseId)) as ServerSpinResultDto;
        const normalized = normalizeSpinResponse(apiResult);
        return ApiValidator.validate(SpinResponseSchema, normalized, 'SpinResponse');
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
