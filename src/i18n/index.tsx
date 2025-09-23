import React from 'react';

type LanguageCode = 'en' | 'ru';

interface TranslationDict {
  [key: string]: string | TranslationDict;
}

const en: TranslationDict = {
  common: {
    balance: 'Balance',
    deposit: 'Deposit',
    connectedWallet: 'Connected wallet:',
    disconnect: 'Disconnect',
    inviteTitle: 'Invite Friends',
    inviteCta: 'Invite',
    inventory: 'Inventory:',
    showAll: 'Show all',
    showAvailable: 'Show available',
    loadingInventory: 'Loading your inventory...',
    offlineFeatures: 'You are offline. Some features are disabled.',
    failedToLoad: 'Failed to load items. Please try again.',
    tryAgain: 'Try Again',
    emptyNoCases: "You haven't opened any cases yet",
    emptyOpenCases: 'Open Cases',
    ofPattern: '{count} of {total}',
    model: 'Model',
    symbol: 'Symbol',
    backdrop: 'Backdrop',
    mintable: 'Mintable',
    yes: 'Yes',
    basic100: 'Basic (100%)',
    sell: 'Sell',
    receive: 'Receive',
    close: 'Close',
    sold: 'Sold',
    active: 'Active',
    received: 'Received'
  },
  modal: {
    craftTitle: 'Craft item',
    craft: 'Craft',
    needMoreShards: 'Need more shards'
  },
  deposit: {
    selectMethod: 'Select the method of deposit',
    methodTon: 'USDT',
    methodCryptoBot: 'CryptoBot',
    methodGifts: 'Gifts',
    promoTitle: 'Get a bonus on your deposit',
    promoSubtitle: 'Look for promo codes in @casebot or in the channels of our partners.',
    promoPlaceholder: 'Promocode',
    promoInvalid: 'Promocode not found or limit exceeded',
    toReceive: 'To receive:',
    amountPlaceholder: 'Enter amount',
    amountAria: 'Enter amount',
    walletQrAlt: 'Wallet QR',
    copy: 'Copy',
    buttonDeposit: 'Deposit',
    cryptoSubtitle: 'You will be redirected to CryptoBot in Telegram.',
    openCrypto: 'Open CryptoBot',
    back: 'Back',
    giftsSubtitle: 'Use Gift cards to top up your balance.',
    comingSoon: 'Coming soon',
    modalTitleSelect: 'Deposit',
    modalTitleTon: 'USDT Deposit',
    modalSubtitleTon: 'Enter the amount to deposit',
    apiError: 'Failed to prepare transaction. Please try again.',
    successTitle: 'Payment received',
    successSubtitle: 'Your balance has been updated'
  },
  home: {
    loadingCases: 'Loading case data...'
  },
  success: {
    title: 'Success',
    ok: 'OK'
  },
  loading: {
    connecting: 'Connecting...',
    connectingTelegram: 'Connecting to Telegram...',
    authSuccess: 'Authentication successful',
    authFailed: 'Authentication failed',
    waitingTelegram: 'Waiting for Telegram...',
    initializing: 'Initializing...',
    authErrorTitle: 'Authentication Error',
    noTelegramData: 'No Telegram initialization data available',
    appName: 'Gift Cases',
    casesByPortal: 'Cases by Portal',
    copyright: 'Copyright © 2025'
  },
  roulette: {
    spin: 'Spin',
    spinning: 'Spinning...',
    notEnoughFunds: 'Not enough funds',
    deposit: 'Deposit',
    showWin: 'Show win',
    possiblePrizes: 'Possible prizes:',
    keepIt: 'Keep it',
    quickSell: 'Quick Sell',
    rarity: 'Rarity',
    price: 'Price',
    rarityNames: {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary'
    }
  },
  prizes: {
    gift: { description: 'A wrapped surprise from the case. Keep it or trade it.' },
    giftShard: { description: 'Combine {required} shards to craft a full Gift.' },
    teddyBear: { description: 'A cuddly bear to brighten your inventory.' },
    scroll: { description: 'An ancient scroll whispering secrets. A rare find.' },
    frog: { description: 'A mystical frog. Legends say it brings fortune.' },
    diamond: { description: 'A brilliant diamond that shines with epic value.' },
    dragon: { description: 'A dragon relic shimmering with fiery power.' },
    ton: { description: 'TON token you can use across the game.' },
    // Discount coupons
    discount10: { description: 'Discount coupon 10% for purchases.' },
    discount15: { description: 'Discount coupon 15% for purchases.' },
    discount30: { description: 'Discount coupon 30% for purchases.' },
    discount50: { description: 'Discount coupon 50% for purchases.' },
    // Shards for discount coupons
    discountShard10: { description: 'Collect {required} shards to craft a 10% discount coupon.' },
    discountShard15: { description: 'Collect {required} shards to craft a 15% discount coupon.' },
    discountShard30: { description: 'Collect {required} shards to craft a 30% discount coupon.' },
    discountShard50: { description: 'Collect {required} shards to craft a 50% discount coupon.' }
  },
  nav: {
    main: 'Main',
    profile: 'Profile',
    jackpot: 'Portal',
    upgrade: 'Upgrade'
  },
  messages: {
    freeBanner1: 'Check our news',
    freeBanner6: 'Spin the wheel and win',
    freeBanner7: 'Collect shards faster',
    openCase: '@casebot',
    freeCase: 'Free Case'
  }
};

const ru: TranslationDict = {
  common: {
    balance: 'Баланс',
    deposit: 'Пополнить',
    connectedWallet: 'Подключённый кошелёк:',
    disconnect: 'Отключить',
    inviteTitle: 'Пригласи друзей',
    inviteCta: 'Пригласить',
    inventory: 'Инвентарь:',
    showAll: 'Показать все',
    showAvailable: 'Показать доступные',
    loadingInventory: 'Загружаем ваш инвентарь...',
    offlineFeatures: 'Упс! Нет интернета.',
    failedToLoad: 'Не удалось загрузить элементы. Попробуйте ещё раз.',
    tryAgain: 'Повторить',
    emptyNoCases: 'Вы ещё не открывали кейсы',
    emptyOpenCases: 'Открыть кейсы',
    ofPattern: '{count} из {total}',
    model: 'Модель',
    symbol: 'Символ',
    backdrop: 'Фон',
    mintable: 'Доступен минт',
    yes: 'Да',
    basic100: 'Базовый (100%)',
    sell: 'Продать',
    receive: 'Получить',
    close: 'Закрыть',
    sold: 'Продано',
    active: 'Активен',
    received: 'Получено'
  },
  modal: {
    craftTitle: 'Собрать предмет',
    craft: 'Собрать',
    needMoreShards: 'Недостаточно осколков'
  },
  deposit: {
    selectMethod: 'Выберите способ пополнения',
    methodTon: 'USDT',
    methodCryptoBot: 'CryptoBot',
    methodGifts: 'Подарки',
    promoTitle: 'Получите бонус к пополнению',
    promoSubtitle: 'Ищите промокоды в @casebot или у наших партнёров.',
    promoPlaceholder: 'Промокод',
    promoInvalid: 'Промокод не найден или лимит исчерпан',
    toReceive: 'К получению:',
    amountPlaceholder: 'Введите сумму',
    amountAria: 'Введите сумму',
    walletQrAlt: 'QR кошелька',
    copy: 'Копировать',
    buttonDeposit: 'Пополнить',
    cryptoSubtitle: 'Вы будете перенаправлены в CryptoBot в Telegram.',
    openCrypto: 'Открыть CryptoBot',
    back: 'Назад',
    giftsSubtitle: 'Используйте подарочные карты, чтобы пополнить баланс.',
    comingSoon: 'Скоро',
    modalTitleSelect: 'Пополнение',
    modalTitleTon: 'Пополнение USDT',
    modalSubtitleTon: 'Введите сумму пополнения',
    apiError: 'Не удалось подготовить транзакцию. Попробуйте ещё раз.',
    successTitle: 'Платёж получен',
    successSubtitle: 'Ваш баланс обновлён'
  },
  home: {
    loadingCases: 'Загружаем ваши кейсы...'
  },
  success: {
    title: 'Готово',
    ok: 'OK'
  },
  loading: {
    connecting: 'Подключение...',
    connectingTelegram: 'Подключение к Telegram...',
    authSuccess: 'Успешная авторизация',
    authFailed: 'Ошибка авторизации',
    waitingTelegram: 'Ожидание Telegram...',
    initializing: 'Инициализация...',
    authErrorTitle: 'Ошибка авторизации',
    noTelegramData: 'Нет данных инициализации Telegram',
    appName: 'Gift Cases',
    casesByPortal: 'Cases by Portal',
    copyright: 'Copyright © 2025'
  },
  roulette: {
    spin: 'Крутить',
    spinning: 'Крутим...',
    notEnoughFunds: 'Недостаточно средств',
    deposit: 'Пополнить',
    showWin: 'Показывать выигрыш',
    possiblePrizes: 'Возможные призы:',
    keepIt: 'Забрать',
    quickSell: 'Быстрая продажа',
    rarity: 'Редкость',
    price: 'Цена',
    rarityNames: {
      common: 'Обычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный'
    }
  },
  prizes: {
    gift: { description: 'Завёрнутый сюрприз из кейса. Забери или продай.' },
    giftShard: { description: 'Соберите {required} осколков, чтобы создать полный Подарок.' },
    teddyBear: { description: 'Плюшевый медведь, поднимает настроение.' },
    scroll: { description: 'Древний свиток, шепчущий секреты. Редкая находка.' },
    frog: { description: 'Мистическая лягушка. Говорят, приносит удачу.' },
    diamond: { description: 'Сверкающий алмаз — эпическая ценность.' },
    dragon: { description: 'Драконья реликвия, пылающая силой.' },
    ton: { description: 'Токен TON, полезный для покупок и наград.' },
    // Купоны на скидку
    discount10: { description: 'Купон на скидку 10% на покупки.' },
    discount15: { description: 'Купон на скидку 15% на покупки.' },
    discount30: { description: 'Купон на скидку 30% на покупки.' },
    discount50: { description: 'Купон на скидку 50% на покупки.' },
    // Осколки для купонов
    discountShard10: { description: 'Соберите {required} осколков, чтобы получить купон на скидку 10%.' },
    discountShard15: { description: 'Соберите {required} осколков, чтобы получить купон на скидку 15%.' },
    discountShard30: { description: 'Соберите {required} осколков, чтобы получить купон на скидку 30%.' },
    discountShard50: { description: 'Соберите {required} осколков, чтобы получить купон на скидку 50%.' }
  },
  nav: {
    main: 'Главная',
    profile: 'Профиль',
    jackpot: 'Портал',
    upgrade: 'Апгрейд'
  },
  messages: {
    freeBanner1: 'Следите за новостями',
    freeBanner6: 'Крути рулетку и побеждай',
    freeBanner7: 'Собирайте осколки',
    openCase: '@casebot',
    freeCase: 'Free case'
  }
};

const dictionaries: Record<LanguageCode, TranslationDict> = { en, ru };

function detectInitialLanguage(): LanguageCode {
  const stored = localStorage.getItem('lang');
  if (stored === 'en' || stored === 'ru') return stored;
  const nav = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

function format(template: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return template;
  return template.replace(/\{(.*?)\}/g, (_, key) => {
    const v = params[key.trim()];
    return v === undefined || v === null ? '' : String(v);
  });
}

function getNested(dict: TranslationDict, path: string): string | undefined {
  const parts = path.split('.');
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = (cur as any)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

export interface I18nApi {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number | undefined>) => string;
}

const I18nContext = React.createContext<I18nApi | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = React.useState<LanguageCode>(detectInitialLanguage);

  const setLang = React.useCallback((next: LanguageCode) => {
    setLangState(next);
    localStorage.setItem('lang', next);
  }, []);

  // Expose global setter for console usage and support cross-tab changes
  React.useEffect(() => {
    (window as any).setLang = setLang;
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lang' && (e.newValue === 'en' || e.newValue === 'ru')) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      if ((window as any).setLang === setLang) {
        try { delete (window as any).setLang; } catch {}
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [setLang]);

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number | undefined>) => {
      const primary = getNested(dictionaries[lang], key);
      const fallbackLang: LanguageCode = lang === 'en' ? 'ru' : 'en';
      const fallback = getNested(dictionaries[fallbackLang], key);
      const chosen = primary || fallback || key;
      return format(chosen, params);
    },
    [lang]
  );

  const api = React.useMemo<I18nApi>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nApi {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


