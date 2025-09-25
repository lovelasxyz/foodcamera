import { apiClient } from './apiClient';
import { normalizeApiError } from './apiError';
import { API_CONFIG, resolveApiUrl, isApiEnabled } from '@/config/api.config';
import { User } from '@/types/user';
import { mockUser, mockSpin, mockDeposit } from './apiMocks';
import { ApiSpinResult, ApiDeposit, CreateDepositRequest, AuthResponse, SpinRequestDto } from '@/types/api';
import { useUserStore } from '@/store/userStore';

// Deprecated inline interfaces removed – using central API types.

export class ApiService {
  private authToken: string | null = null;

  setToken(token: string) {
    this.authToken = token;
  }

  private withAuthHeaders(init?: RequestInit): RequestInit {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    return { ...(init || {}), headers: { ...(init?.headers || {}), ...headers } };
  }

  async authWithTelegram(initData: string): Promise<string> {
    if (!isApiEnabled()) {
      // return pseudo-token so rest of flow can proceed
      const token = 'mock-token';
      this.setToken(token);
      return token;
    }
    const url = resolveApiUrl(API_CONFIG.ENDPOINTS.AUTH_TELEGRAM);
    try {
      const res = await fetch(url, { method: 'POST', body: JSON.stringify({ initData }), ...this.withAuthHeaders() });
      if (!res.ok) throw new Error('Auth failed');
      const data = (await res.json()) as AuthResponse;
  this.setToken(data.token);
  useUserStore.getState().setTokenMeta?.(data.refreshToken || null, data.expiresIn || null);
      return data.token;
    } catch (e) {
      throw normalizeApiError(e);
    }
  }

  async getCurrentUser(): Promise<User> {
    if (!isApiEnabled()) {
      return mockUser();
    }
    const url = resolveApiUrl(API_CONFIG.ENDPOINTS.USER_ME);
    try { return await apiClient.get<User>(url); } catch (e) { throw normalizeApiError(e); }
  }

  async spin(caseId: string): Promise<ApiSpinResult> {
    if (!isApiEnabled()) {
      return mockSpin(caseId);
    }
    const url = resolveApiUrl(API_CONFIG.ENDPOINTS.SPIN);
    const payload: SpinRequestDto = { caseId, requestId: crypto.randomUUID?.() || `req-${Date.now()}` };
    try { return await apiClient.post<ApiSpinResult>(url, payload); } catch (e) { throw normalizeApiError(e); }
  }

  async createDeposit(payload: CreateDepositRequest): Promise<ApiDeposit> {
    if (!isApiEnabled()) {
      return mockDeposit(payload.amount);
    }
    const url = resolveApiUrl(API_CONFIG.ENDPOINTS.DEPOSIT_CREATE);
    try { return await apiClient.post<ApiDeposit>(url, payload); } catch (e) { throw normalizeApiError(e); }
  }

  async refreshToken(): Promise<string | null> {
    if (!isApiEnabled()) return this.authToken;
    const state = useUserStore.getState();
    const refresh = state.refreshToken;
    if (!refresh) return null;
    try {
      const url = resolveApiUrl('/auth/refresh');
      const res = await fetch(url, { method: 'POST', body: JSON.stringify({ refreshToken: refresh }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) return null;
      const data = (await res.json()) as AuthResponse;
      this.setToken(data.token);
      useUserStore.getState().setTokenMeta?.(data.refreshToken || refresh, data.expiresIn || null);
      useUserStore.getState().setToken(data.token);
      return data.token;
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();
