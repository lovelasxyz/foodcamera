// Константы приложения

export const APP_CONFIG = {
  name: 'Cases Frontend',
  version: '1.0.0',
  description: 'Приложение для открытия кейсов с рулеткой'
} as const;

export const GAME_CONFIG = {
  spinDuration: 8000, // Время вращения рулетки в мс
  resultDelay: 1000,  // Задержка перед показом результата в мс
  animationTension: 60,
  animationFriction: 25
} as const;

export const UI_CONFIG = {
  notificationDuration: 5000, // Время показа уведомления в мс
  maxInventoryDisplay: 50,    // Максимальное количество элементов для отображения в инвентаре
  caseGridColumns: {
    mobile: 2,
    tablet: 3,
    desktop: 4
  }
} as const;

export const RARITY_COLORS = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b'
} as const;

export const TOKEN_SYMBOL = 'T';

export const ROUTES = {
  home: '/',
  profile: '/profile',
  inventory: '/inventory',
  weekly: '/weekly',
  jackpot: '/jackpot',
  upgrade: '/upgrade'
} as const; 

// Пути к изображениям
export const ASSET_PATHS = {
  IMAGES: {
    AVATAR: '/assets/images/avatar.png',
    BURGER: '/assets/images/burger.png',
    DIAMOND: '/assets/images/diamond.png',
    DRAGON: '/assets/images/dragon.png',
    FREE_CASE: '/assets/images/free-case.png',
    FROG: '/assets/images/frog.png',
    GIFT: '/assets/images/gift.png',
    HELMET: '/assets/images/helmet.png',
    JACKPOT: '/assets/images/jackpot.svg',
    LIGHTNING: '/assets/images/lightning.svg',
    PROFILE: '/assets/images/profile.svg',
    SCROLL: '/assets/images/scroll.png',
    TEDDY: '/assets/images/teddy.png',
    TOKEN_GOLD: '/assets/images/ton.svg',
    TOKEN: '/assets/images/ton.svg',
    TON: '/assets/images/ton.svg',
    UPGRADE: '/assets/images/upgrade.svg',
    WIZARD_HAT: '/assets/images/wizard-hat.png'
  }
} as const;

// Цвета градиентов для кейсов
export const CASE_GRADIENT_COLORS = {
  FREE: '#23C265',
  LOW: '#0095EA',      // 0-1 TON
  MEDIUM: '#8A2BFF',   // 1-5 TON
  HIGH: '#FF5C2B',     // 5-15 TON
  EXPENSIVE: '#FFAE00', // 15-50 TON
  PREMIUM: '#FF484A'   // 50+ TON
} as const;

// Пороги цен для градиентов
export const PRICE_THRESHOLDS = {
  FREE: 0,
  LOW: 1,
  MEDIUM: 5,
  HIGH: 15,
  EXPENSIVE: 50
} as const;

// Сообщения
export const MESSAGES = {
  INSUFFICIENT_FUNDS: 'Недостаточно средств для открытия кейса',
  LOADING_CASES: 'Loading cases...',
  SPINNING: 'Spinning...',
  CHECK_NEWS: 'Check our news',
  OPEN_CASE: 'Open @case',
  FREE_CASE: 'Free Case',
  POSSIBLE_PRIZES: 'Possible prizes:',
  INSUFFICIENT_BALANCE: 'Insufficient balance. Need',
  YOU_WON: 'You won!',
  KEEP_IT: 'Keep it',
  QUICK_SELL: 'Quick Sell',
  UPGRADE: 'Upgrade'
} as const; 