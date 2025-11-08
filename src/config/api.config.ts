// Central API endpoints configuration (minimal placeholder until real backend is ready)
// Adjust BASE_URL via environment when backend appears.
// Backwards compatibility: we already had legacy spin env vars (.env.development / .env.production)
//   VITE_SPIN_API_URL, VITE_FORCE_LOCAL_SPIN. We gracefully read them so existing files keep working.

import { DevLogger } from '@/services/devtools/loggerService';

// Access Vite env safely (typed as any for broader compatibility with Vite's dynamic import.meta.env shape)
const viteEnv: any = (import.meta as any)?.env || {};

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
    base: 'https://foodcameraserver-production.up.railway.app:8080/api',
    shouldUseApi: true,
    source: 'local-default'
  };

  if (typeof window === 'undefined') {
    return { ...localDefault, source: 'ssr-default' };
  }

  try {
    const { origin, hostname } = window.location;
    if (!origin) {
      return localDefault;
    }

    const isLocalHost = hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname.endsWith('.localhost');

    if (isLocalHost) {
      return localDefault;
    }

    return {
      base: `${origin.replace(/\/+$/, '')}/api`,
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

let useApi = false;
if (!forceMocks) {
  if (unifiedUseApiFlag) {
    useApi = true;
  } else if (hasExplicitBase) {
    useApi = true;
  } else if (defaultBaseResolution.shouldUseApi) {
    useApi = true;
  }
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
    USER_ME: '/users/me',
    USER_PROFILE: '/users/me',
    USERS: '/users',
    SPIN: '/spin',
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
