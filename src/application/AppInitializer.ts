import { shouldUseGuestMode } from '@/utils/environment';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { useUserStore } from '@/store/userStore';
import { attachGlobalErrorHandlers, DevLogger } from '@/services/devtools/loggerService';
import { getRealtimeSync } from '@/infrastructure/sync/RealtimeSync';
import { isApiEnabled } from '@/config/api.config';

/**
 * AppInitializer encapsulates app-level initialization side-effects.
 * Designed for composition in App component; keeps App.tsx cleaner.
 */
export class AppInitializer {
  private realtimeSync = getRealtimeSync();

  start(): void {
    ConnectivityGuard.start();
    attachGlobalErrorHandlers();
    this.initializeRealtimeSync();
  }

  stop(): void {
    try {
      ConnectivityGuard.stop();
      this.realtimeSync.disconnect();
    } catch { /* ignore stop errors */ }
    // При остановке приложения можем очистить кеш если нужно
    // (в данном случае оставляем кеш для быстрого следующего запуска)
  }

  /**
   * Initialize WebSocket for real-time synchronization
   */
  private initializeRealtimeSync(): void {
    if (!isApiEnabled()) {
      DevLogger.logInfo('API disabled, skipping real-time sync initialization');
      return;
    }

    const { token } = useUserStore.getState();
    if (token) {
      DevLogger.logInfo('Initializing real-time sync with token');
      this.realtimeSync.connect(token);

      // Subscribe to real-time events
      this.realtimeSync.subscribe('balance.updated', ({ newBalance }) => {
        DevLogger.logInfo('Real-time balance update received', { newBalance });
        useUserStore.setState((state) => ({
          user: { ...state.user, balance: newBalance }
        }));
      });

      this.realtimeSync.subscribe('inventory.item_added', ({ item, fromCase }) => {
        DevLogger.logInfo('Real-time inventory item added', { item, fromCase });
        useUserStore.getState().addToInventory(item, fromCase);
      });

      this.realtimeSync.subscribe('user.stats_updated', (stats) => {
        DevLogger.logInfo('Real-time stats update received', stats);
        useUserStore.setState((state) => ({
          user: { ...state.user, stats: { ...state.user.stats, ...stats } }
        }));
      });

      this.realtimeSync.subscribe('connection.status', ({ connected }) => {
        DevLogger.logInfo('Real-time connection status', { connected });
        if (connected) {
          // Re-sync user data on reconnection
          useUserStore.getState().loadUser();
        }
      });
    } else {
      DevLogger.logInfo('No token available, skipping real-time sync');
    }
  }

  async bootstrapForGuestIfNeeded(): Promise<void> {
    if (shouldUseGuestMode()) {
      const { loadUser } = useUserStore.getState();
      await loadUser();
    }
  }

  // Other bootstrap helpers may be added (analytics, feature flags, etc.)
}

export default AppInitializer;
