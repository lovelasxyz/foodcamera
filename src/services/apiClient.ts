import { DevLogger } from '@/services/devtools/loggerService';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: any): Promise<T>;
}

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const start = performance.now();
    DevLogger.logRequest('GET', url);
    try {
  const token = useUserStore.getState().token;
  const requestId = (crypto as any).randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const res = await fetch(url, { credentials: 'include', headers: { 'X-Request-Id': requestId, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  (apiClient as any).lastRequestId = requestId;
      const duration = performance.now() - start;
      const cloned = res.clone();
      let body: unknown = undefined;
      try { body = await cloned.json(); } catch { /* ignore */ }
      DevLogger.logResponse('GET', url, res.status, res.ok, { durationMs: Math.round(duration), body });
      if (res.status === 401) {
        useUserStore.getState().setToken(null);
        useUIStore.getState().setSessionExpired(true);
        useUIStore.getState().setLastError({ message: 'Session expired', code: 401 });
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        // Attempt structured error envelope parsing
        if (body && typeof body === 'object' && (body as any).error) {
          const errObj = (body as any).error;
          const code = errObj.code || res.status;
            const message = errObj.message || `GET ${url} failed`;
          useUIStore.getState().setLastError({ message, code });
          throw new Error(message);
        }
        throw new Error(`GET ${url} failed: ${res.status}`);
      }
      return (body as T) ?? (res.json() as Promise<T>);
    } catch (err) {
      DevLogger.logError(`GET ${url} failed`, err);
      throw err;
    }
  }
  async post<T>(url: string, body?: any): Promise<T> {
    const start = performance.now();
    DevLogger.logRequest('POST', url, { body });
    try {
      const token = useUserStore.getState().token;
      const requestId = (crypto as any).randomUUID?.() || `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include'
      });
      (apiClient as any).lastRequestId = requestId;
      const duration = performance.now() - start;
      const cloned = res.clone();
      let responseBody: unknown = undefined;
      try { responseBody = await cloned.json(); } catch { /* ignore */ }
      DevLogger.logResponse('POST', url, res.status, res.ok, { durationMs: Math.round(duration), body: responseBody });
      if (res.status === 401) {
        useUserStore.getState().setToken(null);
        useUIStore.getState().setSessionExpired(true);
        useUIStore.getState().setLastError({ message: 'Session expired', code: 401 });
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        if (responseBody && typeof responseBody === 'object' && (responseBody as any).error) {
          const errObj = (responseBody as any).error;
          const code = errObj.code || res.status;
          const message = errObj.message || `POST ${url} failed`;
          useUIStore.getState().setLastError({ message, code });
          throw new Error(message);
        }
        throw new Error(`POST ${url} failed: ${res.status}`);
      }
      return (responseBody as T) ?? (res.json() as Promise<T>);
    } catch (err) {
      DevLogger.logError(`POST ${url} failed`, err, { body });
      throw err;
    }
  }
}

export const apiClient: HttpClient = new FetchHttpClient();



