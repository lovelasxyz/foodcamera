import { apiClient } from './apiClient';
import { normalizeApiError } from './apiError';
import { API_CONFIG, resolveApiUrl, isApiEnabled } from '@/config/api.config';
import { User } from '@/types/user';
import { mockUser, mockSpin, mockDeposit } from './apiMocks';
import { ApiSpinResult, ApiDeposit, CreateDepositRequest, SpinRequestDto, AuthResponse } from '@/types/api';
import { getAuthToken, setAuthToken, setTokenMeta, refreshAuthToken, resolveExpiresIn } from './authTokenManager';

// Deprecated inline interfaces removed – using central API types.

export class ApiService {
  setToken(token: string | null) {
    setAuthToken(token);
  }

  private withAuthHeaders(init?: RequestInit): RequestInit {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
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
      const token = data.token || (data as any).accessToken;
      if (!token) {
        throw new Error('Auth response does not contain token');
      }
      const expiresIn = resolveExpiresIn(data);
      this.setToken(token);
      setTokenMeta(data.refreshToken || null, expiresIn);
      return token;
    } catch (e) {
      throw normalizeApiError(e);
    }
  }

  async getCurrentUser(): Promise<User> {
    if (!isApiEnabled()) {
      return mockUser();
    }
    const profileUrl = resolveApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE);
    try {
      return await apiClient.get<User>(profileUrl);
    } catch (primaryErr) {
      // Fallback to legacy endpoint for backward compatibility
      try {
        const legacyUrl = resolveApiUrl(API_CONFIG.ENDPOINTS.USER_ME);
        return await apiClient.get<User>(legacyUrl);
      } catch (fallbackErr) {
        throw normalizeApiError(primaryErr || fallbackErr);
      }
    }
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
    return refreshAuthToken();
  }
}

export const apiService = new ApiService();
