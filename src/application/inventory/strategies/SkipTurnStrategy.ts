import type { Prize } from '@/types/game';
import type { AwardContext, AwardOutcome, IPrizeAwardStrategy } from './PrizeAwardStrategy';

/**
 * Strategy for handling "skip turn" prizes.
 * Does nothing - player gets nothing.
 */
export class SkipTurnStrategy implements IPrizeAwardStrategy {
  canHandle(prize: Prize): boolean {
    return prize.benefit?.type === 'skip_turn';
  }

  award(_prize: Prize, _fromCase: string, _context: AwardContext): AwardOutcome {
    return { kind: 'skipped_owned', reason: 'skip_turn' };
  }
}
