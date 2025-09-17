import { apiClient } from '@/services/apiClient';

/**
 * Minimal OOP base for repositories — provides fetch helpers and simple fallbacks.
 * Keep it intentionally small for MVP: extend in concrete repositories when needed.
 */
export abstract class BaseRepository {
  protected api = apiClient;

  protected async fetchWithFallback<T>(url: string, fallback?: T): Promise<T> {
    try {
      return await this.api.get<T>(url);
    } catch (e) {
      if (typeof fallback !== 'undefined') return fallback;
      throw e;
    }
  }
}

export default BaseRepository;
