/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_API?: string; // 'true' | 'false'
  readonly VITE_USE_MOCKS?: string; // 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
