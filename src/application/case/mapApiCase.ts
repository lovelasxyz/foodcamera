import { ApiCase, ApiCasePrizeRef } from '@/types/api';
import { Case, Prize } from '@/types/game';
import { PrizeSorter } from '@/utils/prizeSorter';

// Map ApiCase to existing domain Case type expected by UI.
export function mapApiCase(api: ApiCase): Case {
  // Case interface требует background, которого нет в ApiCase -> задаём дефолт.
  // Если backend позже пришлёт background, нужно расширить ApiCase и маппер.
  const mappedPrizes = api.prizes.map(mapApiCasePrize);

  return {
    id: api.id,
    name: api.name,
    price: api.price,
    image: api.image || '',
    background: 'default',
    items: PrizeSorter.sortByRarity(mappedPrizes)
  };
}

function mapApiCasePrize(p: ApiCasePrizeRef): Prize {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    rarity: p.rarity as Prize['rarity'],
    isShard: p.isShard,
    shardKey: p.shardKey,
    shardsRequired: p.shardsRequired,
    description: p.description,
    benefit: p.benefit,
    uniqueKey: p.uniqueKey,
    stackable: p.stackable,
    notAwardIfOwned: p.notAwardIfOwned,
    nonRemovableGift: p.nonRemovableGift
  } as Prize;
}
