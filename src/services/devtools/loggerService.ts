export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogKind = 'log' | 'request' | 'response' | 'error' | 'exception' | 'rejection';

export interface BaseLogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  kind: LogKind;
  message: string;
  context?: Record<string, unknown>;
}

export interface RequestLogEntry extends BaseLogEntry {
  kind: 'request';
  context: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  } & Record<string, unknown>;
}

export interface ResponseLogEntry extends BaseLogEntry {
  kind: 'response';
  context: {
    method: string;
    url: string;
    status: number;
    ok: boolean;
    durationMs?: number;
    headers?: Record<string, string>;
    body?: unknown;
  } & Record<string, unknown>;
}

export type LogEntry = BaseLogEntry | RequestLogEntry | ResponseLogEntry;

type Listener = (entry: LogEntry) => void;

class LoggerService {
  private buffer: LogEntry[] = [];
  private maxSize = 500;
  private listeners = new Set<Listener>();

  setMaxSize(size: number) {
    this.maxSize = Math.max(50, Math.min(size, 5000));
    this.trim();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getAll(): LogEntry[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }

  export(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  private push(entry: LogEntry) {
    this.buffer.push(entry);
    this.trim();
    for (const l of this.listeners) l(entry);
  }

  private trim() {
    if (this.buffer.length > this.maxSize) {
      this.buffer.splice(0, this.buffer.length - this.maxSize);
    }
  }

  log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: BaseLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      level,
      kind: 'log',
      message,
      context,
    };
    this.push(entry);
  }

  logRequest(method: string, url: string, context?: Record<string, unknown>) {
    const entry: RequestLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      level: 'info',
      kind: 'request',
      message: `${method.toUpperCase()} ${url}`,
      context: { method, url, ...context },
    };
    this.push(entry);
    return entry;
  }

  logResponse(
    method: string,
    url: string,
    status: number,
    ok: boolean,
    context?: Record<string, unknown>
  ) {
    const entry: ResponseLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      level: ok ? 'info' : 'error',
      kind: 'response',
      message: `${method.toUpperCase()} ${url} -> ${status}`,
      context: { method, url, status, ok, ...context },
    };
    this.push(entry);
    return entry;
  }

  logError(message: string, err?: unknown, context?: Record<string, unknown>) {
    const payload: Record<string, unknown> = { ...context };
    if (err instanceof Error) {
      payload.name = err.name;
      payload.message = err.message;
      payload.stack = err.stack;
    } else if (err != null) {
      payload.error = err;
    }
    const entry: BaseLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      level: 'error',
      kind: 'error',
      message,
      context: payload,
    };
    this.push(entry);
    return entry;
  }
}

export const DevLogger = new LoggerService();

// Helpers to hook global errors (call from AppInitializer)
export function attachGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    DevLogger.logError('window.onerror', e.error ?? e.message, {
      filename: (e as ErrorEvent).filename,
      lineno: (e as ErrorEvent).lineno,
      colno: (e as ErrorEvent).colno,
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    DevLogger.logError('Unhandled Promise Rejection', (e as PromiseRejectionEvent).reason);
  });
}
