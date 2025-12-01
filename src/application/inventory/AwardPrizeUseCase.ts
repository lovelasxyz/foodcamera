import type { Prize } from '@/types/game';
import type { InventoryItem } from '@/types/user';
import type { AwardOutcome, AwardContext, IPrizeAwardStrategy } from './strategies/PrizeAwardStrategy';
import { FiatUsdtStrategy } from './strategies/FiatUsdtStrategy';
import { StackablePrizeStrategy } from './strategies/StackablePrizeStrategy';
import { ShardStrategy } from './strategies/ShardStrategy';
import { RegularPrizeStrategy } from './strategies/RegularPrizeStrategy';

// Re-export for backward compatibility
export type { AwardOutcome };

/**
 * Use Case for awarding prizes to players.
 * Follows Strategy Pattern for extensibility and Single Responsibility Principle.
 * New prize types can be added by creating new strategies without modifying this class.
 */
export class AwardPrizeUseCase {
  private readonly strategies: IPrizeAwardStrategy[];
  private readonly context: AwardContext;

  constructor(
    getInventory: () => InventoryItem[],
    addInventoryItem: (item: InventoryItem) => void,
    getShardCount: (key: string) => number,
    setShardCount: (key: string, newCount: number) => void,
    addBalance: (amount: number) => void
  ) {
    // Build context once
    this.context = {
      getInventory,
      addInventoryItem,
      getShardCount,
      setShardCount,
      addBalance
    };

    // Initialize strategies in priority order
    // Each strategy is checked in order until one handles the prize
    this.strategies = [
      new FiatUsdtStrategy(),
      new StackablePrizeStrategy(),
      new ShardStrategy(),
      new RegularPrizeStrategy() // Fallback strategy, always last
    ];
  }

  /**
   * Awards a prize to the player.
   * Delegates to the first matching strategy.
   *
   * @param prize - The prize to award
   * @param fromCase - Source case identifier
   * @returns Outcome of the award operation
   */
  public award(prize: Prize, fromCase: string = 'Case'): AwardOutcome {
    const strategy = this.strategies.find(s => s.canHandle(prize));

    if (!strategy) {
      throw new Error(`No strategy found to handle prize: ${prize.name}`);
    }

    return strategy.award(prize, fromCase, this.context);
  }
}
