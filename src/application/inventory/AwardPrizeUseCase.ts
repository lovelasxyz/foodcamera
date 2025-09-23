import { Inventory } from '@/domain/inventory/Inventory';
import type { Prize } from '@/types/game';
import type { InventoryItem } from '@/types/user';

type GetInventoryFn = () => InventoryItem[];
type AddInventoryFn = (item: InventoryItem) => void;
type GetShardCountFn = (key: string) => number;
type SetShardCountFn = (key: string, newCount: number) => void;

export type AwardOutcome =
  | { kind: 'added'; inventoryItem: InventoryItem }
  | { kind: 'skipped_owned'; reason: 'already_owned' }
  | { kind: 'shard_increment'; key: string; before: number; after: number };

export class AwardPrizeUseCase {
  constructor(
    private readonly getInventory: GetInventoryFn,
    private readonly addInventoryItem: AddInventoryFn,
    private readonly getShardCount: GetShardCountFn,
    private readonly setShardCount: SetShardCountFn
  ) {}

  public award(prize: Prize, fromCase: string = 'Case'): AwardOutcome {
    // 1) Осколки: увеличиваем прогресс (без авто-крафтинга)
    if (prize.isShard && prize.shardKey) {
      const key = prize.shardKey;
      const before = this.getShardCount(key) || 0;
      const after = before + 1;
      this.setShardCount(key, after);

      return { kind: 'shard_increment', key, before, after };
    }

    // 2) Обычные призы: проверка уникальности и выдача
    if (prize.notAwardIfOwned && prize.uniqueKey) {
      const exists = this.getInventory().some(i => i.prize.uniqueKey === prize.uniqueKey);
      if (exists) {
        return { kind: 'skipped_owned', reason: 'already_owned' };
      }
    }

    const item = Inventory.createInventoryItem(prize, fromCase);
    this.addInventoryItem(item);
    return { kind: 'added', inventoryItem: item };
  }
}
