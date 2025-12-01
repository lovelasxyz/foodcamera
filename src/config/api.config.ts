// Central API endpoints configuration (minimal placeholder until real backend is ready)
// Adjust BASE_URL via environment when backend appears.
// Backwards compatibility: we already had legacy spin env vars (.env.development / .env.production)
//   VITE_SPIN_API_URL, VITE_FORCE_LOCAL_SPIN. We gracefully read them so existing files keep working.

import { DevLogger } from '@/services/devtools/loggerService';

// Access Vite env safely (typed as any for broader compatibility with Vite's dynamic import.meta.env shape)
const viteEnv: any = (import.meta as any)?.env || {};

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isDevelopmentMode = viteEnv.DEV === true || viteEnv.MODE === 'development';

console.log('[API Config] Environment detection:', {
  isLocalhost,
  isDevelopmentMode,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  viteEnv_DEV: viteEnv.DEV,
  viteEnv_MODE: viteEnv.MODE,
  viteEnv_VITE_USE_API: viteEnv.VITE_USE_API,
  viteEnv_VITE_USE_MOCKS: viteEnv.VITE_USE_MOCKS
});

// Legacy vars (spin-only) fallback support
const legacySpinBase: string | undefined = viteEnv.VITE_SPIN_API_URL;
const legacyForceLocal = (viteEnv.VITE_FORCE_LOCAL_SPIN || '').toLowerCase() === 'true';

// New unified vars
const unifiedBase = viteEnv.VITE_API_BASE_URL as string | undefined;
const unifiedUseApiFlag = (viteEnv.VITE_USE_API || '').toLowerCase() === 'true';
const unifiedForceMocks = (viteEnv.VITE_USE_MOCKS || '').toLowerCase() === 'true';

type DefaultBaseSource = 'same-origin' | 'local-default' | 'ssr-default';

interface DefaultBaseResolution {
  base: string;
  shouldUseApi: boolean;
  source: DefaultBaseSource;
}

const resolveDefaultBase = (): DefaultBaseResolution => {
  // Default to hosted backend so dev builds talk to the live API unless overridden via env
  const localDefault: DefaultBaseResolution = {
    base: 'http://localhost:5053/api',
    shouldUseApi: true,
    source: 'local-default'
  };

  if (typeof window === 'undefined') {
    return { ...localDefault, source: 'ssr-default' };
  }

  try {
    const { origin } = window.location;
    if (!origin) {
      return localDefault;
    }

    // If running on localhost, default to localhost backend
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return localDefault;
    }

    // Otherwise (e.g. Vercel), default to Railway
    return {
        base: 'https://foodcameraserver-production.up.railway.app/api',
        shouldUseApi: true,
        source: 'same-origin'
    };
  } catch (_error) {
    return localDefault;
  }
};

const defaultBaseResolution = resolveDefaultBase();
const rawBase = unifiedBase || legacySpinBase || defaultBaseResolution.base;
const deriveRealtimeBaseUrl = (apiBase: string): string => {
  try {
    const url = new URL(apiBase);
    let path = url.pathname.replace(/\/+$/, '');
    if (path.toLowerCase().endsWith('/api')) {
      path = path.slice(0, -4);
    }
    if (!path) {
      path = '/';
    }
    url.pathname = path;
    const originWithPath = `${url.origin}${url.pathname === '/' ? '' : url.pathname}`;
    return originWithPath.replace(/\/+$/, '');
  } catch (_err) {
    return apiBase.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  }
};

const realtimeBase = deriveRealtimeBaseUrl(rawBase);
const forceMocks = unifiedForceMocks || legacyForceLocal;
const hasExplicitBase = Boolean(unifiedBase || legacySpinBase);

// Explicit priority logic:
// 1. If VITE_USE_MOCKS=true -> force mocks, disable API
// 2. If VITE_USE_API=false -> disable API
// 3. If VITE_USE_API=true -> enable API
// 4. If has explicit base URL -> enable API
// 5. Otherwise use default resolution
let useApi = false;

if (forceMocks) {
  useApi = false;
} else if (viteEnv.VITE_USE_API !== undefined && viteEnv.VITE_USE_API !== null && viteEnv.VITE_USE_API !== '') {
  useApi = unifiedUseApiFlag;
} else if (hasExplicitBase) {
  useApi = true;
} else {
  useApi = defaultBaseResolution.shouldUseApi;
}

const baseSource: 'unified' | 'legacy' | DefaultBaseSource = unifiedBase
  ? 'unified'
  : legacySpinBase
    ? 'legacy'
    : defaultBaseResolution.source;

DevLogger.logInfo('[API Config] Configuration loaded', {
  unifiedUseApiFlag,
  unifiedBase,
  unifiedForceMocks,
  legacySpinBase,
  legacyForceLocal,
  forceMocks,
  useApi,
  rawBase,
  baseSource,
  defaultBaseResolution,
  viteEnv: {
    VITE_USE_API: viteEnv.VITE_USE_API,
    VITE_USE_MOCKS: viteEnv.VITE_USE_MOCKS,
    VITE_API_BASE_URL: viteEnv.VITE_API_BASE_URL
  }
});

export const API_CONFIG = {
  BASE_URL: rawBase,
  REALTIME_BASE_URL: realtimeBase,
  USE_API: useApi,
  FORCE_MOCKS: forceMocks,
  ENDPOINTS: {
    AUTH_TELEGRAM: '/auth/telegram',
    AUTH_GUEST: '/auth/guest',
    USER_ME: '/users/me',
    USER_PROFILE: '/users/me',
    USERS: '/users',
    SPIN: '/game/spin',
    DEPOSIT_CREATE: '/billing/deposit',
    INVENTORY: '/inventory',
    CASES: '/cases',
    BANNERS: '/banners',
    PRODUCTS: '/products',
  }
} as const;

export const isApiEnabled = (): boolean => {
  const enabled = API_CONFIG.USE_API && !API_CONFIG.FORCE_MOCKS;
  DevLogger.logInfo('[API Config] isApiEnabled', {
    enabled,
    USE_API: API_CONFIG.USE_API,
    FORCE_MOCKS: API_CONFIG.FORCE_MOCKS,
    BASE_URL: API_CONFIG.BASE_URL
  });
  return enabled;
};

export type ApiEndpointKey = keyof typeof API_CONFIG.ENDPOINTS;

export const resolveApiUrl = (path: string) => {
  if (!path.startsWith('/')) return `${API_CONFIG.BASE_URL}/${path}`;
  return `${API_CONFIG.BASE_URL}${path}`;
};

export const resolveRealtimeUrl = (path: string) => {
  if (!path.startsWith('/')) return `${API_CONFIG.REALTIME_BASE_URL}/${path}`;
  return `${API_CONFIG.REALTIME_BASE_URL}${path}`;
};
