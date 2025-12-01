const TOKEN_KEY = 'app_token_v2';
const BALANCE_KEY = 'user_balance_v2';
const DEV_SNAPSHOT_KEY = 'dev_user_snapshot_v2';

const isClient = typeof window !== 'undefined';

function safeGetItem(key: string): string | null {
  if (!isClient) return null;
  try {
    const val = window.localStorage.getItem(key);
    // console.log(`[UserStorage] Get ${key}:`, val);
    return val;
  } catch (e) {
    console.error(`[UserStorage] Failed to get ${key}`, e);
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isClient) return;
  try {
    window.localStorage.setItem(key, value);
    // console.log(`[UserStorage] Set ${key}:`, value);
  } catch (e) {
    console.error(`[UserStorage] Failed to set ${key}`, e);
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
    console.log('[UserStorage] Saving token to localStorage:', token);
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
