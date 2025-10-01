export type ProductBenefit =
  | { type: 'discount'; percent: 10 | 15 | 30 | 50 }
  | { type: 'subscription'; service: 'tg_premium'; months: 3 }
  | { type: 'lottery_ticket' }
  | { type: 'bigwin' }
  | { type: 'fiat_usdt'; amount: number } // Фиат USDT, зачисляется сразу на баланс
  | { type: 'weekly_ticket' } // Накапливающийся билет на еженедельный розыгрыш (истекает через неделю)
  | { type: 'permanent_token'; amount: number } // Постоянный токен (накапливается без срока действия)
  | { type: 'skip_turn' }; // Пропуск хода - ничего не дается

export interface Prize {
  id: number;
  name: string;
  price: number;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isShard?: boolean;
  shardKey?: string;
  shardsRequired?: number;
  description?: string;
  benefit?: ProductBenefit;
  uniqueKey?: string;
  stackable?: boolean;
  notAwardIfOwned?: boolean;
  nonRemovableGift?: boolean;
}

export interface Case {
  id: number;
  name: string;
  image: string;
  price: number;
  background: string;
  items: Prize[];
  isNew?: boolean;
  blackBackdrop?: boolean;
}

export interface SpinResult {
  prize: Prize;
  position: number;
  timestamp: number;
}

export interface GameSession {
  caseId: number;
  isDemo: boolean;
  startTime: number;
  result?: SpinResult;
}

export interface RouletteConfig {
  readonly ITEM_WIDTH: number;
  readonly BASE_SPINS: number;
  readonly SPIN_DURATION: number;
  readonly RESULT_DELAY: number;
  readonly ANIMATION_EASING: (t: number) => number;
}

export interface Multiplier {
  value: number;
  label: string;
}

// Элемент рулетки (для отрисовки дорожки) — приз с дополнительными полями
export interface RouletteItem extends Prize {
  uniqueId: string;
  originalIndex: number;
}

// Константы для конфигурации
export const ROULETTE_CONFIG: RouletteConfig = {
  ITEM_WIDTH: 108,
  BASE_SPINS: 5,
  SPIN_DURATION: 10000,
  RESULT_DELAY: 500,
  ANIMATION_EASING: (t: number) => 1 - Math.pow(1 - t, 4)
};

export const MULTIPLIERS: Multiplier[] = [
  { value: 1, label: 'x1' },
  { value: 2, label: 'x2' },
  { value: 3, label: 'x3' }
];

export const RARITY_COLORS = {
  common: '#5067E5',
  rare: '#C52F81',
  epic: '#C03A42',
  legendary: '#DC904B'
} as const; 