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

type ServerInventoryItemDto = {
  id?: string;
  Id?: string;
  prizeId?: string;
  PrizeId?: string;
  status?: string;
  Status?: string;
  acquiredAt?: string;
  AcquiredAt?: string;
  prize?: ServerPrizeDto;
  Prize?: ServerPrizeDto;
};

type ServerSpinResultDto = {
  prize?: ServerPrizeDto;
  Prize?: ServerPrizeDto;
  userBalance?: number | string;
  UserBalance?: number | string;
  userInventory?: ServerInventoryItemDto[];
  UserInventory?: ServerInventoryItemDto[];
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

const normalizeInventoryItem = (item: ServerInventoryItemDto): any => {
  const id = item.id ?? item.Id ?? '';
  const prizeId = item.prizeId ?? item.PrizeId ?? '';
  const status = item.status ?? item.Status ?? 'active';
  const acquiredAt = item.acquiredAt ?? item.AcquiredAt ?? '';
  const prizeRaw = item.prize ?? item.Prize;
  const prize = prizeRaw ? normalizePrize(prizeRaw) : null;
  
  return {
    id,
    prizeId,
    fromCase: '', // Server doesn't return this in inventory item
    obtainedAt: acquiredAt ? new Date(acquiredAt).getTime() : Date.now(),
    status,
    prize: prize ? {
      id: prize.id,
      name: prize.name || 'Unknown',
      price: prize.price ?? 0,
      image: prize.image || '/assets/images/placeholder.png',
      rarity: prize.rarity || 'common'
    } : {
      id: Number(prizeId),
      name: 'Unknown',
      price: 0,
      image: '/assets/images/placeholder.png',
      rarity: 'common' as const
    }
  };
};

const normalizeSpinResponse = (dto: ServerSpinResultDto): SpinResponse => {
  const prize = normalizePrize(dto.prize ?? dto.Prize);
  if (!prize) {
    throw new Error('Spin result is missing prize payload');
  }

  const balance = toNumber(dto.userBalance ?? dto.UserBalance);
  const rawInventory = dto.userInventory ?? dto.UserInventory;
  const inventory = rawInventory ? rawInventory.map(normalizeInventoryItem) : undefined;
  
  const userPatch: any = {};
  if (typeof balance === 'number') {
    userPatch.balance = balance;
  }
  if (inventory) {
    userPatch.inventory = inventory;
  }

  return {
    prizeId: prize.id,
    serverPrize: prize,
    userPatch: Object.keys(userPatch).length > 0 ? userPatch : undefined,
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
