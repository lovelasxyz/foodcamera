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
  'TON': 'ton'
};

const PRIZE_KEYS = {
  gift: 'prizes.gift.description',
  giftShard: 'prizes.giftShard.description',
  teddyBear: 'prizes.teddyBear.description',
  scroll: 'prizes.scroll.description',
  frog: 'prizes.frog.description',
  diamond: 'prizes.diamond.description',
  dragon: 'prizes.dragon.description',
  ton: 'prizes.ton.description'
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
