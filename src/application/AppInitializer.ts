import { shouldUseGuestMode } from '@/utils/environment';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { useUserStore } from '@/store/userStore';

/**
 * AppInitializer encapsulates app-level initialization side-effects.
 * Designed for composition in App component; keeps App.tsx cleaner.
 */
export class AppInitializer {
  start(): void {
    ConnectivityGuard.start();
  }

  stop(): void {
    try { ConnectivityGuard.stop(); } catch {}
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
