import { useUIStore } from '@/store/uiStore';

class ConnectivityGuardImpl {
  private listenersAttached = false;

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
    const update = () => this.ensureOnline();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    // initial sync
    this.ensureOnline();
  }
}

export const ConnectivityGuard = new ConnectivityGuardImpl();


