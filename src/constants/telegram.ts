const resolveEnvValue = (key: string): string => {
  const viteEnv = (import.meta as any)?.env ?? {};
  const fromVite = viteEnv[key];
  const fromProcess = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)?.[key] : undefined;
  return (fromVite ?? fromProcess ?? '').toString();
};

const sanitizeUsername = (raw: string | undefined): string => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return 'casesbot';
  }
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
};

export const TELEGRAM_CONFIG = {
  miniAppUrl: resolveEnvValue('VITE_TELEGRAM_MINI_APP_URL'),
  botUsername: sanitizeUsername(resolveEnvValue('VITE_TELEGRAM_BOT_USERNAME')),
} as const;
