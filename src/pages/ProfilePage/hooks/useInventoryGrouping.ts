import { useMemo } from 'react';
import { User } from '@/types/user';
import { PrizeItem } from '@/domain/items/PrizeItem';
import { ShardRecipeMapper } from '@/domain/shards/ShardRecipeMapper';
import { useI18n } from '@/i18n';

export type InventoryCard = {
  kind: 'stackable' | 'item' | 'shard';
  id: string;
  image: string;
  price?: number;
  item?: any;
  count?: number;
  benefitType?: string;
  label?: string;
  shardKey?: string;
  required?: number;
  rarity?: string;
  updatedAt: number;
};

export function useInventoryGrouping(user: User) {
  const { t } = useI18n();

  // Оптимизация: кэшируем длину инвентаря для dependency
  const inventoryLength = user.inventory.length;
  const shardsKeys = Object.keys(user.shards || {}).join(',');

  const combinedInventory = useMemo(() => {
    // Group stackable prizes (weekly_ticket, permanent_token) by benefit type
    const stackableGroups = new Map<string, typeof user.inventory>();
    const regularItems: typeof user.inventory = [];

    // Оптимизация: один проход вместо нескольких
    for (let i = 0; i < user.inventory.length; i++) {
      const inv = user.inventory[i];
      const benefit = inv.prize.benefit;
      if (benefit?.type === 'weekly_ticket' || benefit?.type === 'permanent_token') {
        const key = benefit.type;
        if (!stackableGroups.has(key)) {
          stackableGroups.set(key, []);
        }
        stackableGroups.get(key)!.push(inv);
      } else {
        regularItems.push(inv);
      }
    }

    // Create cards for stackable prizes (grouped)
    const stackableCards = Array.from(stackableGroups.entries()).map(([benefitType, items]) => {
      const firstItem = items[0];
      const dto = new PrizeItem(firstItem.prize);
      let latestUpdate = 0;
      for (let i = 0; i < items.length; i++) {
        const ts = items[i].obtainedAt || 0;
        if (ts > latestUpdate) latestUpdate = ts;
      }

      // For permanent_token: count = items * 100, for weekly_ticket: count = items
      const count = benefitType === 'permanent_token'
        ? items.length * 100
        : items.length;

      return {
        kind: 'stackable' as const,
        id: `stackable-${benefitType}`,
        image: dto.data.image,
        price: dto.price,
        item: firstItem,
        count,
        benefitType,
        updatedAt: latestUpdate
      };
    });

    // Regular item cards
    const itemCards: InventoryCard[] = [];
    for (let i = 0; i < regularItems.length; i++) {
      const inv = regularItems[i];
      const dto = new PrizeItem(inv.prize);
      itemCards.push({
        kind: 'item' as const,
        id: inv.id,
        image: dto.data.image,
        price: dto.price,
        item: inv,
        updatedAt: inv.obtainedAt || 0
      });
    }

    // Shard cards
    const shards: InventoryCard[] = [];
    const shardEntries = Object.entries(user.shards || {});
    for (let i = 0; i < shardEntries.length; i++) {
      const [key, count] = shardEntries[i];
      const cfg = ShardRecipeMapper.fromConstants().find(r => r.key === key);
      shards.push({
        kind: 'shard' as const,
        id: `shard-${key}`,
        image: cfg?.shardImage || '',
        label: t('common.ofPattern', { count, total: cfg?.required ?? 10 }),
        shardKey: key,
        count,
        required: cfg?.required ?? 10,
        rarity: 'common' as const,
        updatedAt: (user as any).shardUpdatedAt?.[key] || 0
      });
    }

    // Sort by updatedAt descending
    const combined = [...stackableCards, ...itemCards, ...shards];
    combined.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return combined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryLength, shardsKeys, t]);

  return combinedInventory;
}
