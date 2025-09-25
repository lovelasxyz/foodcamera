import { ApiCase, ApiCasePrizeRef } from '@/types/api';
import { Case, Prize } from '@/types/game';

// Map ApiCase to existing domain Case type expected by UI.
export function mapApiCase(api: ApiCase): Case {
  // Case interface требует background, которого нет в ApiCase -> задаём дефолт.
  // Если backend позже пришлёт background, нужно расширить ApiCase и маппер.
  return {
    id: api.id,
    name: api.name,
    price: api.price,
    image: api.image || '',
    background: 'default',
    items: api.prizes.map(mapApiCasePrize)
  };
}

function mapApiCasePrize(p: ApiCasePrizeRef): Prize {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    rarity: p.rarity as Prize['rarity']
  } as Prize;
}
