const TOKEN_KEY = 'app_token_v1';
const BALANCE_KEY = 'user_balance_v1';
const DEV_SNAPSHOT_KEY = 'dev_user_snapshot_v1';

const isClient = typeof window !== 'undefined';

function safeGetItem(key: string): string | null {
  if (!isClient) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isClient) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota errors
  }
}

function safeRemoveItem(key: string): void {
  if (!isClient) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const userStorage = {
  // Token
  getToken: (): string | null => safeGetItem(TOKEN_KEY),
  setToken: (token: string | null) => {
    if (token) safeSetItem(TOKEN_KEY, token);
    else safeRemoveItem(TOKEN_KEY);
  },

  // Balance
  getBalance: (): number | null => {
    const raw = safeGetItem(BALANCE_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : null;
  },
  setBalance: (balance: number) => {
    safeSetItem(BALANCE_KEY, String(balance));
  },

  // Dev snapshot
  getDevSnapshot: <T>(): T | null => {
    const raw = safeGetItem(DEV_SNAPSHOT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setDevSnapshot: (data: any) => {
    try {
      safeSetItem(DEV_SNAPSHOT_KEY, JSON.stringify(data));
    } catch {
      // ignore quota
    }
  },
  clearDevSnapshot: () => {
    safeRemoveItem(DEV_SNAPSHOT_KEY);
  },
  clearBalance: () => {
    safeRemoveItem(BALANCE_KEY);
  }
};
