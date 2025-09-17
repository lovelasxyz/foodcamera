export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: any): Promise<T>;
}

class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
  async post<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
}

export const apiClient: HttpClient = new FetchHttpClient();



