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
  common: '#5067E5',
  rare: '#C52F81',
  epic: '#C03A42',
  legendary: '#DC904B'
} as const;

export const TOKEN_SYMBOL = 'T';

export const ROUTES = {
  home: '/',
  profile: '/profile',
  inventory: '/inventory',
  upgrade: '/upgrade',
  logs: '/__logs'
} as const; 

// Пути к изображениям перемещены в src/constants/assets.ts


// Цвета градиентов для кейсов
export const CASE_GRADIENT_COLORS = {
  FREE: '#23C265',
  LOW: '#00bc78',      // 0-1 TON
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
  OPEN_CASE: '@casebot',
  FREE_CASE: 'Free Case',
  POSSIBLE_PRIZES: 'Possible prizes:',
  INSUFFICIENT_BALANCE: 'Insufficient balance. Need',
  YOU_WON: 'You won!',
  KEEP_IT: 'Keep it',
  QUICK_SELL: 'Quick Sell',
  UPGRADE: 'Upgrade',
  FREE_BANNER_1: 'Check our news',
  FREE_BANNER_2: 'Invite friends and get rewards',
  FREE_BANNER_3: 'Open your Free Case today',
  FREE_BANNER_4: 'Daily bonuses are waiting for you',
  FREE_BANNER_5: 'Follow updates in our channel',
  FREE_BANNER_6: 'Spin the wheel and win',
  FREE_BANNER_7: 'Collect shards faster',
  FREE_BANNER_8: 'Limited-time events every week',
  FREE_BANNER_9: 'Boost your luck today',
  FREE_BANNER_10: 'New cases added regularly',
  FREE_BANNER_11: 'Complete tasks for extra rewards',
  FREE_BANNER_12: 'Join the top winners board'
} as const; 