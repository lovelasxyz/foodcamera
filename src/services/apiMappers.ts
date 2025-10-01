import { ApiUser, ApiSpinResult, ApiInventoryItem, ApiPrize } from '@/types/api';
import { User, InventoryItem } from '@/types/user';
import { Prize, SpinResult } from '@/types/game';

// Prize mapping (server prize -> domain prize)
export const mapPrize = (p: ApiPrize): Prize => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.image,
  rarity: p.rarity,
  isShard: p.isShard,
  shardKey: p.shardKey,
  shardsRequired: p.shardsRequired,
  description: p.description,
  benefit: p.benefit,
  uniqueKey: p.uniqueKey,
  stackable: p.stackable,
  notAwardIfOwned: p.notAwardIfOwned,
  nonRemovableGift: p.nonRemovableGift
});

export const mapInventoryItem = (item: ApiInventoryItem): InventoryItem => ({
  id: item.id,
  fromCase: item.fromCase,
  obtainedAt: item.obtainedAt,
  prize: item.prize ? mapPrize(item.prize) : {
    id: item.prizeId,
    name: 'Unknown Prize',
    price: 0,
    image: '/assets/images/placeholder.png',
    rarity: 'common'
  },
  status: item.status
});

export const mapUser = (u: ApiUser): User => ({
  id: u.id,
  name: u.name,
  avatar: u.avatar,
  balance: u.balance,
  status: u.status,
  isAdmin: u.isAdmin,
  inventory: (u.inventory || []).map(mapInventoryItem),
  shards: u.shards,
  shardUpdatedAt: u.shardUpdatedAt,
  lastDrop: u.lastDrop,
  stats: u.stats,
  telegram: u.telegram && {
    id: u.telegram.id,
    username: u.telegram.username,
    registeredAt: u.telegram.registeredAt,
    hasPhoto: u.telegram.hasPhoto,
    photoUrl: u.telegram.photoUrl
  },
  perks: u.perks
});

export const mapSpinResult = (r: ApiSpinResult): SpinResult => ({
  prize: mapPrize(r.prize),
  position: r.position,
  timestamp: r.timestamp
});
