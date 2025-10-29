// Central API endpoints configuration (minimal placeholder until real backend is ready)
// Adjust BASE_URL via environment when backend appears.
// Backwards compatibility: we already had legacy spin env vars (.env.development / .env.production)
//   VITE_SPIN_API_URL, VITE_FORCE_LOCAL_SPIN. We gracefully read them so existing files keep working.

// Access Vite env safely (typed as any for broader compatibility with Vite's dynamic import.meta.env shape)
const viteEnv: any = (import.meta as any)?.env || {};

// Legacy vars (spin-only) fallback support
const legacySpinBase: string | undefined = viteEnv.VITE_SPIN_API_URL;
const legacyForceLocal = (viteEnv.VITE_FORCE_LOCAL_SPIN || '').toLowerCase() === 'true';

// New unified vars
const unifiedBase = viteEnv.VITE_API_BASE_URL as string | undefined;
const unifiedUseApiFlag = (viteEnv.VITE_USE_API || '').toLowerCase() === 'true';
const unifiedForceMocks = (viteEnv.VITE_USE_MOCKS || '').toLowerCase() === 'true';

// Resolution rules:
// 1. BASE_URL: prefer unified VITE_API_BASE_URL; else fallback to legacy spin base; else default example.
// 2. USE_API: if unified flag explicitly set -> use it; else if legacy base present & not legacyForceLocal -> treat as enabled.
// 3. FORCE_MOCKS: unified flag OR legacyForceLocal (legacy local spin implies mocks for now).
const rawBase = unifiedBase || legacySpinBase || 'http://localhost:5053/api';
const forceMocks = unifiedForceMocks || legacyForceLocal;
const useApi = unifiedUseApiFlag || (!!unifiedBase && !forceMocks) || (!!legacySpinBase && !legacyForceLocal);

export const API_CONFIG = {
  BASE_URL: rawBase,
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

export const isApiEnabled = (): boolean => API_CONFIG.USE_API && !API_CONFIG.FORCE_MOCKS;

export type ApiEndpointKey = keyof typeof API_CONFIG.ENDPOINTS;

export const resolveApiUrl = (path: string) => {
  if (!path.startsWith('/')) return `${API_CONFIG.BASE_URL}/${path}`;
  return `${API_CONFIG.BASE_URL}${path}`;
};
