import { DevLogger } from '@/services/devtools/loggerService';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { resolveApiUrl, isApiEnabled } from '@/config/api.config';
import { captureError, addBreadcrumb } from '@/services/errorTracking';

export interface HttpClient {
  get<T>(url: string, opts?: RequestOptions): Promise<T>;
  post<T>(url: string, body?: any, opts?: RequestOptions): Promise<T>;
}

export interface RequestOptions {
  timeoutMs?: number; // request timeout
  baseUrl?: string;   // override base URL
  signal?: AbortSignal;
  headers?: Record<string, string>;
  raw?: boolean; // if true, return Response json untouched
}

interface InternalRequestMeta {
  method: string;
  url: string;
  startedAt: number;
  requestId: string;
}

interface StructuredApiError extends Error {
  status?: number;
  requestId?: string;
  endpoint?: string;
  meta?: Record<string, unknown>;
}

class FetchHttpClient implements HttpClient {
  private async request<T>(method: 'GET' | 'POST', url: string, body?: any, opts?: RequestOptions): Promise<T> {
    const meta: InternalRequestMeta = {
      method,
      url,
      startedAt: performance.now(),
      requestId: (crypto as any).randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    };
    const token = useUserStore.getState().token;
    const controller = new AbortController();
    const timeoutMs = opts?.timeoutMs ?? 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const baseUrl = opts?.baseUrl || (isApiEnabled() ? undefined : undefined); // left for future custom base override
    const finalUrl = baseUrl ? `${baseUrl}${url}` : url;

    DevLogger.logRequest(method, finalUrl, { body, requestId: meta.requestId });
    addBreadcrumb('api.request', `${method} ${finalUrl}`, { requestId: meta.requestId });
    try {
      const headers: Record<string, string> = {
        'X-Request-Id': meta.requestId,
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts?.headers || {})
      };
      const res = await fetch(finalUrl, {
        method,
        credentials: 'include',
        headers,
        body: method === 'POST' && body != null ? JSON.stringify(body) : undefined,
        signal: opts?.signal || controller.signal
      });
      clearTimeout(timeoutId);
      (apiClient as any).lastRequestId = meta.requestId;
      const duration = performance.now() - meta.startedAt;
      const cloned = res.clone();
      let json: any = undefined;
      try { json = await cloned.json(); } catch { /* ignore non-JSON */ }
      DevLogger.logResponse(method, finalUrl, res.status, res.ok, { durationMs: Math.round(duration), body: json });
      addBreadcrumb('api.response', `${method} ${finalUrl} ${res.status}`, { ok: res.ok });

      if (res.status === 401) {
        useUserStore.getState().setToken(null);
        useUIStore.getState().setSessionExpired(true);
        useUIStore.getState().setLastError({ message: 'Session expired', code: 401 });
        const unauth: StructuredApiError = new Error('Unauthorized');
        unauth.status = 401;
        unauth.requestId = meta.requestId;
        unauth.endpoint = finalUrl;
        captureError(unauth, { level: 'error', tags: { type: 'api', status: '401' }, extra: { method } });
        throw unauth;
      }

      if (!res.ok) {
        const structured = this.buildError(method, finalUrl, res.status, json, meta.requestId);
        useUIStore.getState().setLastError({ message: structured.message, code: structured.status });
        captureError(structured, { level: 'error', tags: { type: 'api', status: String(res.status) } });
        throw structured;
      }
      return (json as T) ?? (res.json() as Promise<T>);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const timeoutErr: StructuredApiError = new Error(`Request timeout after ${timeoutMs}ms`);
        timeoutErr.status = 0;
        timeoutErr.requestId = meta.requestId;
        timeoutErr.endpoint = url;
        captureError(timeoutErr, { level: 'error', tags: { type: 'api', kind: 'timeout' } });
        DevLogger.logError(`${meta.method} ${url} timeout`, timeoutErr);
        throw timeoutErr;
      }
      DevLogger.logError(`${meta.method} ${url} failed`, err, { requestId: meta.requestId });
      captureError(err, { level: 'error', tags: { type: 'api', kind: 'exception' } });
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildError(method: string, url: string, status: number, body: any, requestId: string): StructuredApiError {
    let message = `${method} ${url} failed: ${status}`;
    if (body && typeof body === 'object') {
      if (body.error) {
        message = body.error.message || message;
      } else if (body.message && typeof body.message === 'string') {
        message = body.message;
      }
    }
    const err: StructuredApiError = new Error(message);
    err.status = status;
    err.requestId = requestId;
    err.endpoint = url;
    err.meta = { body };
    return err;
  }

  async get<T>(url: string, opts?: RequestOptions): Promise<T> {
    const final = this.prepareUrl(url);
    return this.request<T>('GET', final, undefined, opts);
  }
  async post<T>(url: string, body?: any, opts?: RequestOptions): Promise<T> {
    const final = this.prepareUrl(url);
    return this.request<T>('POST', final, body, opts);
  }

  private prepareUrl(url: string): string {
    if (/^https?:/i.test(url)) return url; // already absolute
    return resolveApiUrl(url);
  }
}

export const apiClient: HttpClient = new FetchHttpClient();



