import type { Prize } from '@/types/game';
import type { AwardContext, AwardOutcome, IPrizeAwardStrategy } from './PrizeAwardStrategy';

/**
 * Strategy for handling USDT fiat prizes.
 * Credits balance immediately without adding to inventory.
 */
export class FiatUsdtStrategy implements IPrizeAwardStrategy {
  canHandle(prize: Prize): boolean {
    return prize.benefit?.type === 'fiat_usdt';
  }

  award(prize: Prize, _fromCase: string, context: AwardContext): AwardOutcome {
    if (!prize.benefit || prize.benefit.type !== 'fiat_usdt') {
      throw new Error('Invalid prize type for FiatUsdtStrategy');
    }

    const amount = prize.benefit.amount;
    context.addBalance(amount);
    return { kind: 'balance_credited', amount };
  }
}
