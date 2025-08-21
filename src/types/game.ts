export interface Prize {
  id: number;
  name: string;
  price: number;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Осколочная система (опционально)
  // Если приз является осколком, то при выпадении он увеличивает прогресс
  // сборки полноценного подарка по ключу shardKey до количества shardsRequired
  isShard?: boolean;
  shardKey?: string;        // уникальный ключ набора осколков
  shardsRequired?: number;  // сколько осколков нужно для сборки
  description?: string;     // описание для модального окна
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
  common: '#23C265',
  rare: '#0095EA',
  epic: '#8A2BFF',
  legendary: '#FFD700'
} as const; 