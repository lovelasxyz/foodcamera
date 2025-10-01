import type { Prize } from '@/types/game';
import type { AwardContext, AwardOutcome, IPrizeAwardStrategy } from './PrizeAwardStrategy';

/**
 * Strategy for handling shard prizes.
 * Increments shard count for crafting.
 */
export class ShardStrategy implements IPrizeAwardStrategy {
  canHandle(prize: Prize): boolean {
    return Boolean(prize.isShard && prize.shardKey);
  }

  award(prize: Prize, _fromCase: string, context: AwardContext): AwardOutcome {
    if (!prize.shardKey) {
      throw new Error('Shard prize must have shardKey');
    }

    const key = prize.shardKey;
    const before = context.getShardCount(key) || 0;
    const after = before + 1;
    context.setShardCount(key, after);

    return { kind: 'shard_increment', key, before, after };
  }
}
