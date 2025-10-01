import { Inventory } from '@/domain/inventory/Inventory';
import type { Prize } from '@/types/game';
import type { AwardContext, AwardOutcome, IPrizeAwardStrategy } from './PrizeAwardStrategy';

/**
 * Strategy for handling regular prizes.
 * Adds to inventory with optional uniqueness check.
 */
export class RegularPrizeStrategy implements IPrizeAwardStrategy {
  canHandle(_prize: Prize): boolean {
    // This is the fallback strategy, handles everything not handled by others
    return true;
  }

  award(prize: Prize, fromCase: string, context: AwardContext): AwardOutcome {
    // Check uniqueness if required
    if (prize.notAwardIfOwned && prize.uniqueKey) {
      const exists = context
        .getInventory()
        .some(i => i.prize.uniqueKey === prize.uniqueKey);

      if (exists) {
        return { kind: 'skipped_owned', reason: 'already_owned' };
      }
    }

    const item = Inventory.createInventoryItem(prize, fromCase);
    context.addInventoryItem(item);
    return { kind: 'added', inventoryItem: item };
  }
}
