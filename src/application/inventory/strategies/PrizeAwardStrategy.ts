import type { Prize } from '@/types/game';
import type { InventoryItem } from '@/types/user';

/**
 * Result of awarding a prize.
 * Follows Open/Closed Principle - can be extended with new outcome types.
 */
export type AwardOutcome =
  | { kind: 'added'; inventoryItem: InventoryItem }
  | { kind: 'skipped_owned'; reason: 'already_owned' | 'skip_turn' }
  | { kind: 'shard_increment'; key: string; before: number; after: number }
  | { kind: 'balance_credited'; amount: number };

/**
 * Context object containing dependencies for prize awarding.
 * Follows Dependency Injection principle.
 */
export interface AwardContext {
  getInventory: () => InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  getShardCount: (key: string) => number;
  setShardCount: (key: string, newCount: number) => void;
  addBalance: (amount: number) => void;
}

/**
 * Strategy interface for awarding different types of prizes.
 * Follows Strategy Pattern and Single Responsibility Principle.
 */
export interface IPrizeAwardStrategy {
  /**
   * Checks if this strategy can handle the given prize.
   */
  canHandle(prize: Prize): boolean;

  /**
   * Awards the prize using the provided context.
   */
  award(prize: Prize, fromCase: string, context: AwardContext): AwardOutcome;
}
