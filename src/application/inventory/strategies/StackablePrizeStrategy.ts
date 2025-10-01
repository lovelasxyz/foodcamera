import { Inventory } from '@/domain/inventory/Inventory';
import type { Prize } from '@/types/game';
import type { AwardContext, AwardOutcome, IPrizeAwardStrategy } from './PrizeAwardStrategy';

/**
 * Strategy for handling stackable prizes (Weekly Ticket, Permanent Token).
 * Adds to inventory as regular items that can be grouped.
 */
export class StackablePrizeStrategy implements IPrizeAwardStrategy {
  canHandle(prize: Prize): boolean {
    return (
      prize.benefit?.type === 'weekly_ticket' ||
      prize.benefit?.type === 'permanent_token'
    );
  }

  award(prize: Prize, fromCase: string, context: AwardContext): AwardOutcome {
    const item = Inventory.createInventoryItem(prize, fromCase);
    context.addInventoryItem(item);
    return { kind: 'added', inventoryItem: item };
  }
}
