export type EventHandler<T> = (event: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler<any>>>();

  on<T>(eventName: string, handler: EventHandler<T>): () => void {
    const set = this.handlers.get(eventName) ?? new Set();
    set.add(handler as EventHandler<any>);
    this.handlers.set(eventName, set);
    return () => set.delete(handler as EventHandler<any>);
  }

  emit<T>(eventName: string, event: T): void {
    const set = this.handlers.get(eventName);
    if (!set) return;
    for (const handler of set) {
      try { (handler as EventHandler<T>)(event); } catch { /* no-op */ }
    }
  }
}

export const DomainEventBus = new EventBus();




