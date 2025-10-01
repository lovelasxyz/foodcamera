import { Prize } from '@/types/game';
import { useI18n } from './index';

// Map known item names to i18n keys. We keep names unchanged (no diamond1, etc.).
const nameToKey: Record<string, keyof typeof PRIZE_KEYS> = {
  'Gift': 'gift',
  'Gift Shard': 'giftShard',
  'Teddy Bear': 'teddyBear',
  'Scroll': 'scroll',
  'Frog': 'frog',
  'Diamond': 'diamond',
  'Dragon': 'dragon',
  'TON': 'ton',
  // Discount coupons (crafted products)
  'Discount 10%': 'discount10',
  'Discount 15%': 'discount15',
  'Discount 30%': 'discount30',
  'Discount 50%': 'discount50',
  // Discount shards (case items)
  'Discount 10% Shard': 'discountShard10',
  'Discount 15% Shard': 'discountShard15',
  'Discount 30% Shard': 'discountShard30',
  'Discount 50% Shard': 'discountShard50',
  // New prizes
  'USDT 0.2': 'usdt',
  'USDT 0.3': 'usdt',
  'USDT 0.5': 'usdt',
  'USDT 0.8': 'usdt',
  'Weekly Lottery Ticket': 'weeklyTicket',
  'Permanent Token': 'permanentToken',
  'Skip Turn': 'skipTurn'
};

const PRIZE_KEYS = {
  gift: 'prizes.gift.description',
  giftShard: 'prizes.giftShard.description',
  teddyBear: 'prizes.teddyBear.description',
  scroll: 'prizes.scroll.description',
  frog: 'prizes.frog.description',
  diamond: 'prizes.diamond.description',
  dragon: 'prizes.dragon.description',
  ton: 'prizes.ton.description',
  discount10: 'prizes.discount10.description',
  discount15: 'prizes.discount15.description',
  discount30: 'prizes.discount30.description',
  discount50: 'prizes.discount50.description',
  discountShard10: 'prizes.discountShard10.description',
  discountShard15: 'prizes.discountShard15.description',
  discountShard30: 'prizes.discountShard30.description',
  discountShard50: 'prizes.discountShard50.description',
  usdt: 'prizes.usdt.description',
  weeklyTicket: 'prizes.weeklyTicket.description',
  permanentToken: 'prizes.permanentToken.description',
  skipTurn: 'prizes.skipTurn.description'
} as const;

export function usePrizeDescription() {
  const { t } = useI18n();
  return (prize?: Prize | null) => {
    if (!prize) return undefined;
    const keyName = nameToKey[prize.name];
    const i18nKey = keyName ? PRIZE_KEYS[keyName] : undefined;
    if (!i18nKey) return prize.description; // fallback to any provided description
    // Allow shard requirements interpolation if present
    const params = prize.isShard ? { required: prize.shardsRequired } : undefined;
    const text = t(i18nKey, params);
    return text || prize.description;
  };
}
