// Lightweight error tracking abstraction (can be swapped for Sentry, LogRocket, etc.)
// Usage: initErrorTracking({ dsn: import.meta.env.VITE_ERROR_TRACKING_DSN })
// Then call captureError / captureMessage. Automatically disabled if no DSN provided.

interface ErrorTrackingConfig {
  dsn?: string; // DSN or endpoint
  release?: string;
  environment?: string;
  enabled?: boolean;
  maxBreadcrumbs?: number;
}

interface Breadcrumb {
  ts: number;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

let _config: Required<Pick<ErrorTrackingConfig, 'dsn' | 'environment' | 'enabled'>> & Omit<ErrorTrackingConfig, 'dsn' | 'environment' | 'enabled'> = {
  dsn: '',
  environment: (import.meta as any)?.env?.MODE || 'development',
  enabled: false,
  release: undefined,
  maxBreadcrumbs: 50,
};

const _breadcrumbs: Breadcrumb[] = [];

export function initErrorTracking(cfg: ErrorTrackingConfig) {
  _config = { ..._config, ...cfg, enabled: !!cfg.dsn && (cfg.enabled ?? true) } as typeof _config;
  if (_config.enabled) {
    // eslint-disable-next-line no-console
    console.info('[errorTracking] enabled for env', _config.environment);
  }
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  if (!_config.enabled) return;
  _breadcrumbs.push({ ts: Date.now(), category, message, data });
  if (_breadcrumbs.length > _config.maxBreadcrumbs!) _breadcrumbs.shift();
}

interface CaptureBase {
  level?: 'error' | 'warn' | 'info' | 'debug';
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
}

export function captureError(err: unknown, ctx?: CaptureBase) {
  if (!_config.enabled) return;
  try {
    const payload = {
      type: 'error',
      error: serializeError(err),
      breadcrumbs: [..._breadcrumbs],
      context: ctx,
      release: _config.release,
      env: _config.environment,
      ts: Date.now(),
    };
    transmit(payload);
  } catch { /* ignore */ }
}

export function captureMessage(message: string, ctx?: CaptureBase) {
  if (!_config.enabled) return;
  try {
    const payload = {
      type: 'message',
      message,
      breadcrumbs: [..._breadcrumbs],
      context: ctx,
      release: _config.release,
      env: _config.environment,
      ts: Date.now(),
    };
    transmit(payload);
  } catch { /* ignore */ }
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

function transmit(payload: any) {
  // Simple fetch POST; can be replaced with vendor SDK.
  try {
    fetch(_config.dsn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .catch(() => {/* ignore network errors */});
  } catch { /* ignore */ }
}

// Global helpers; call once during app bootstrap if desired.
export function registerGlobalErrorHandlers() {
  if (!_config.enabled) return;
  window.addEventListener('error', (ev) => {
    captureError(ev.error || ev.message, { level: 'error', tags: { source: 'window.error' } });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    captureError(ev.reason, { level: 'error', tags: { source: 'unhandledrejection' } });
  });
}
