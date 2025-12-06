import { apiClient } from './apiClient';
import { normalizeApiError } from './apiError';
import { API_CONFIG, isApiEnabled } from '@/config/api.config';
import { User } from '@/types/user';
import { mockUser, mockSpin, mockDeposit } from './apiMocks';
import { ApiSpinResult, ApiDeposit, CreateDepositRequest, SpinRequestDto, AuthResponse } from '@/types/api';
import { setAuthToken, setTokenMeta, refreshAuthToken, resolveExpiresIn } from './authTokenManager';

/**
 * Central API service - orchestrates all API calls
 * Uses apiClient for HTTP requests (handles auth, retry, logging)
 */
export class ApiService {
  setToken(token: string | null) {
    setAuthToken(token);
  }

  async authWithTelegram(initData: string): Promise<string> {
    if (!isApiEnabled()) {
      const token = 'mock-token';
      this.setToken(token);
      return token;
    }
    
    try {
      const data = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH_TELEGRAM, 
        { initData }
      );
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

  async authGuest(): Promise<string> {
    if (!isApiEnabled()) {
      const token = 'mock-guest-token';
      this.setToken(token);
      return token;
    }
    
    try {
      const data = await apiClient.post<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH_GUEST, {});
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
    
    try {
      return await apiClient.get<User>(API_CONFIG.ENDPOINTS.USER_PROFILE);
    } catch (primaryErr) {
      // Fallback to legacy endpoint for backward compatibility
      try {
        return await apiClient.get<User>(API_CONFIG.ENDPOINTS.USER_ME);
      } catch (fallbackErr) {
        throw normalizeApiError(primaryErr || fallbackErr);
      }
    }
  }

  async spin(caseId: string): Promise<ApiSpinResult> {
    if (!isApiEnabled()) {
      return mockSpin(caseId);
    }
    
    const payload: SpinRequestDto = { 
      caseId, 
      requestId: crypto.randomUUID?.() || `req-${Date.now()}` 
    };
    
    try { 
      return await apiClient.post<ApiSpinResult>(API_CONFIG.ENDPOINTS.SPIN, payload); 
    } catch (e) { 
      throw normalizeApiError(e); 
    }
  }

  async createDeposit(payload: CreateDepositRequest): Promise<ApiDeposit> {
    if (!isApiEnabled()) {
      return mockDeposit(payload.amount);
    }
    
    try { 
      return await apiClient.post<ApiDeposit>(API_CONFIG.ENDPOINTS.DEPOSIT_CREATE, payload); 
    } catch (e) { 
      throw normalizeApiError(e); 
    }
  }

  async refreshToken(): Promise<string | null> {
    return refreshAuthToken();
  }
}

export const apiService = new ApiService();
