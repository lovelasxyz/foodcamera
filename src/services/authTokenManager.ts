import { useUserStore } from '@/store/userStore';
import { resolveApiUrl, isApiEnabled } from '@/config/api.config';
import { AuthResponse } from '@/types/api';

let tokenCache: string | null = null;

const safeGetStore = () => {
  try {
    return useUserStore.getState();
  } catch {
    return null;
  }
};

export const getAuthToken = (): string | null => {
  if (tokenCache != null) {
    return tokenCache;
  }
  const state = safeGetStore();
  tokenCache = state?.token ?? null;
  return tokenCache;
};

export const setAuthToken = (token: string | null): void => {
  tokenCache = token ?? null;
  const state = safeGetStore();
  try {
    state?.setToken(tokenCache);
  } catch {
    /* ignore */
  }
};

export const getTokenExpiry = (): number | null => safeGetStore()?.tokenExpiry ?? null;

export const getRefreshToken = (): string | null => safeGetStore()?.refreshToken ?? null;

export const setTokenMeta = (refreshToken: string | null, expiresInSec: number | null): void => {
  const state = safeGetStore();
  try {
    state?.setTokenMeta?.(refreshToken, expiresInSec);
  } catch {
    /* ignore */
  }
};

export const clearAuthSession = (): void => {
  setAuthToken(null);
  setTokenMeta(null, null);
};

export const resolveExpiresIn = (data: AuthResponse): number | null => {
  if (typeof data.expiresIn === 'number') {
    return data.expiresIn;
  }

  if (data.expiresAt) {
    const expiresAt = typeof data.expiresAt === 'string' ? Date.parse(data.expiresAt) : data.expiresAt;
    if (!Number.isNaN(expiresAt)) {
      const diff = expiresAt - Date.now();
      if (Number.isFinite(diff) && diff > 0) {
        return Math.floor(diff / 1000);
      }
    }
  }

  return null;
};

export const refreshAuthToken = async (): Promise<string | null> => {
  if (!isApiEnabled()) {
    return getAuthToken();
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(resolveApiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as AuthResponse;
    const token = data.token || (data as any).accessToken;
    if (!token) {
      return null;
    }

    const expiresIn = resolveExpiresIn(data);
    setAuthToken(token);
    setTokenMeta(data.refreshToken || refreshToken, expiresIn ?? null);
    return token;
  } catch {
    return null;
  }
};

try {
  tokenCache = safeGetStore()?.token ?? null;
} catch {
  tokenCache = null;
}
