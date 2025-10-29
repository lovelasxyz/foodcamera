export const TELEGRAM_CONFIG = {
  miniAppUrl: (import.meta as any)?.env?.VITE_TELEGRAM_MINI_APP_URL || '',
  botUsername: (import.meta as any)?.env?.VITE_TELEGRAM_BOT_USERNAME || ''
} as const;
