import { User, InventoryItem } from '@/types/user';
import { Prize } from '@/types/game';
import { Inventory } from '@/domain/inventory/Inventory';
import { ShardSystem } from '@/domain/shards/ShardSystem';

export function updateUserBalance(user: User, amount: number): User {
  return {
    ...user,
    balance: Math.max(0, user.balance + amount)
  };
}

export function addInventoryItemToUser(
  user: User,
  prize: Prize,
  fromCase: string,
  status: 'active' | 'sold' | 'received' = 'active'
): { user: User; itemId: string } {
  const inventoryItem = Inventory.createInventoryItem(prize, fromCase);
  const itemWithStatus: InventoryItem = { ...inventoryItem, status } as InventoryItem;

  if (prize.isShard && prize.shardKey) {
    const sys = new ShardSystem();
    const nextShards = sys.addShard(user.shards || {}, prize.shardKey, 1);
    const now = Date.now();
    return {
      user: {
        ...user,
        shards: nextShards,
        shardUpdatedAt: { ...(user.shardUpdatedAt || {}), [prize.shardKey]: now },
        lastDrop: { kind: 'shard', id: prize.shardKey }
      },
      itemId: inventoryItem.id
    };
  }

  return {
    user: {
      ...user,
      inventory: [...user.inventory, itemWithStatus],
      lastDrop: { kind: 'item', id: inventoryItem.id }
    },
    itemId: inventoryItem.id
  };
}

export function receiveInventoryItem(user: User, itemId: string): User {
  const idx = user.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return user;

  const target = user.inventory[idx];
  if (target.status === 'sold' || target.status === 'received') return user;

  const updatedItem: InventoryItem = { ...target, status: 'received' };
  const newInventory = [...user.inventory];
  newInventory[idx] = updatedItem;

  return { ...user, inventory: newInventory };
}

export function sellInventoryItem(user: User, itemId: string): User {
  const idx = user.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return user;

  const target = user.inventory[idx];
  if (target.prize.nonRemovableGift || target.status === 'sold') return user;

  const updatedItem: InventoryItem = { ...target, status: 'sold' };
  const newInventory = [...user.inventory];
  newInventory[idx] = updatedItem;

  return {
    ...user,
    balance: Math.max(0, user.balance + (target.prize.price || 0)),
    inventory: newInventory
  };
}

export function craftFromShards(user: User, shardKey: string, fromCase?: string): User {
  const sys = new ShardSystem();
  const res = sys.craft(user.shards || {}, user.shardUpdatedAt || {}, shardKey);
  if (!res) return user;

  const newItem = Inventory.createInventoryItem(res.prize, fromCase || 'Craft');
  return {
    ...user,
    shards: res.updatedShards,
    shardUpdatedAt: res.updatedShardUpdatedAt,
    inventory: [...user.inventory, newItem],
    lastDrop: { kind: 'item', id: newItem.id }
  };
}

export function incrementSpins(user: User): User {
  if (user.status === 'advertiser') return user;
  const prev = user.stats?.spinsCount ?? 0;
  return {
    ...user,
    stats: { ...(user.stats || { spinsCount: 0, lastAuthAt: null }), spinsCount: prev + 1 }
  };
}

export function setLastAuthNow(user: User): User {
  return {
    ...user,
    stats: { ...(user.stats || { spinsCount: 0, lastAuthAt: null }), lastAuthAt: Date.now() }
  };
}

export function disconnectWallet(user: User, shouldClearData: boolean): User {
  return {
    ...user,
    wallet: undefined,
    ...(shouldClearData ? { balance: 0, inventory: [], shards: {}, shardUpdatedAt: {} } : {})
  };
}

export function mergeInventory(existing: InventoryItem[], fetched: InventoryItem[]): InventoryItem[] {
  if (fetched.length === 0) return existing;
  const existingIds = new Set(existing.map(i => i.id));
  return [...existing, ...fetched.filter(i => !existingIds.has(i.id))];
}
