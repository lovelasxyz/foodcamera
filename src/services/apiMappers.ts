import { User, InventoryItem } from '@/types/user';
import { Prize, SpinResult, ProductBenefit } from '@/types/game';

// Helper to get property with case-insensitive fallback (camelCase first, then PascalCase)
const getProp = <T>(obj: any, camelKey: string): T | undefined => {
  if (obj == null) return undefined;
  if (camelKey in obj) return obj[camelKey];
  const pascalKey = camelKey.charAt(0).toUpperCase() + camelKey.slice(1);
  if (pascalKey in obj) return obj[pascalKey];
  return undefined;
};

// Prize mapping (server prize -> domain prize)
export const mapPrize = (p: any): Prize => ({
  id: getProp<number>(p, 'id') || 0,
  name: getProp<string>(p, 'name') || '',
  price: getProp<number>(p, 'price') ?? 0,
  image: getProp<string>(p, 'image') || '/assets/images/placeholder.png',
  rarity: (getProp<string>(p, 'rarity') || 'common') as 'common' | 'rare' | 'epic' | 'legendary',
  isShard: getProp<boolean>(p, 'isShard'),
  shardKey: getProp<string>(p, 'shardKey'),
  shardsRequired: getProp<number>(p, 'shardsRequired'),
  description: getProp<string>(p, 'description'),
  benefit: getProp<string>(p, 'benefit') as ProductBenefit | undefined,
  uniqueKey: getProp<string>(p, 'uniqueKey'),
  stackable: getProp<boolean>(p, 'stackable'),
  notAwardIfOwned: getProp<boolean>(p, 'notAwardIfOwned'),
  nonRemovableGift: getProp<boolean>(p, 'nonRemovableGift')
});

export const mapInventoryItem = (item: any): InventoryItem => {
  const prize = getProp<any>(item, 'prize');
  const prizeId = getProp<number>(item, 'prizeId') || 0;
  return {
    id: getProp<string>(item, 'id') || '',
    fromCase: getProp<string>(item, 'fromCase') || '',
    obtainedAt: getProp<number>(item, 'obtainedAt') || 0,
    prize: prize ? mapPrize(prize) : {
      id: prizeId,
      name: 'Unknown Prize',
      price: 0,
      image: '/assets/images/placeholder.png',
      rarity: 'common'
    },
    status: (getProp<string>(item, 'status') || 'active') as 'active' | 'received' | 'sold'
  };
};

export const mapUser = (u: any): User => ({
  id: getProp<string>(u, 'id') || '',
  name: getProp<string>(u, 'name') || '',
  avatar: getProp<string>(u, 'avatar') || '',
  balance: getProp<number>(u, 'balance') ?? 0,
  status: getProp<string>(u, 'status') as any || 'regular',
  isAdmin: getProp<boolean>(u, 'isAdmin') || false,
  inventory: (getProp<any[]>(u, 'inventory') || []).map(mapInventoryItem),
  shards: getProp<Record<string, number>>(u, 'shards'),
  shardUpdatedAt: getProp<Record<string, number>>(u, 'shardUpdatedAt'),
  lastDrop: getProp<{ kind: 'item' | 'shard'; id: string } | null>(u, 'lastDrop'),
  stats: getProp<any>(u, 'stats'),
  telegram: (() => {
    const t = getProp<any>(u, 'telegram');
    if (!t) return undefined;
    return {
      id: getProp<string>(t, 'id') || '',
      username: getProp<string>(t, 'username'),
      registeredAt: getProp<number>(t, 'registeredAt') || 0,
      hasPhoto: getProp<boolean>(t, 'hasPhoto'),
      photoUrl: getProp<string>(t, 'photoUrl')
    };
  })(),
  perks: getProp<any>(u, 'perks')
});

export const mapSpinResult = (r: any): SpinResult => ({
  prize: mapPrize(getProp<any>(r, 'prize')),
  position: getProp<number>(r, 'position') || 0,
  timestamp: getProp<number>(r, 'timestamp') || Date.now()
});
