import { useUIStore } from '@/store/uiStore';

class ConnectivityGuardImpl {
  private listenersAttached = false;
  private boundUpdate: (() => void) | null = null;

  private isForcedOffline(): boolean {
    if (typeof window === 'undefined') return false;
    const qsOffline = new URLSearchParams(window.location.search).get('offline') === '1';
    const lsOffline = window.localStorage?.getItem('DEBUG_FORCE_OFFLINE') === '1';
    return qsOffline || lsOffline;
  }

  public isOnline(): boolean {
    if (this.isForcedOffline()) return false;
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }

  public ensureOnline(): boolean {
    const online = this.isOnline();
    // keep UI store in sync
    try {
      useUIStore.getState().setOffline(!online);
    } catch {
      // ignore in non-reactive contexts
    }
    return online;
  }

  public start(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
  this.listenersAttached = true;
  this.boundUpdate = () => this.ensureOnline();
  window.addEventListener('online', this.boundUpdate);
  window.addEventListener('offline', this.boundUpdate);
    // initial sync
    this.ensureOnline();
  }

  public stop(): void {
    if (!this.listenersAttached || typeof window === 'undefined') return;
    if (this.boundUpdate) {
      window.removeEventListener('online', this.boundUpdate);
      window.removeEventListener('offline', this.boundUpdate);
      this.boundUpdate = null;
    }
    this.listenersAttached = false;
  }
}

export const ConnectivityGuard = new ConnectivityGuardImpl();


