import { DevLogger } from '@/services/devtools/loggerService';

export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: any): Promise<T>;
}

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const start = performance.now();
    DevLogger.logRequest('GET', url);
    try {
      const res = await fetch(url, { credentials: 'include' });
      const duration = performance.now() - start;
      const cloned = res.clone();
      let body: unknown = undefined;
      try { body = await cloned.json(); } catch { /* ignore */ }
      DevLogger.logResponse('GET', url, res.status, res.ok, { durationMs: Math.round(duration), body });
      if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
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
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include'
      });
      const duration = performance.now() - start;
      const cloned = res.clone();
      let responseBody: unknown = undefined;
      try { responseBody = await cloned.json(); } catch { /* ignore */ }
      DevLogger.logResponse('POST', url, res.status, res.ok, { durationMs: Math.round(duration), body: responseBody });
      if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
      return (responseBody as T) ?? (res.json() as Promise<T>);
    } catch (err) {
      DevLogger.logError(`POST ${url} failed`, err, { body });
      throw err;
    }
  }
}

export const apiClient: HttpClient = new FetchHttpClient();



