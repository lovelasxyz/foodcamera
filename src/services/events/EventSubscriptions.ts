import { DomainEventBus } from '@/domain/events/EventBus';
import { DomainEventNames, type PrizeWonEvent, type DepositMadeEvent } from '@/domain/events/DomainEvents';
import { useUIStore } from '@/store/uiStore';

function subscribeOnce(): void {
  const add = () => useUIStore.getState().addNotification;

  DomainEventBus.on<PrizeWonEvent>(DomainEventNames.PrizeWon, (evt) => {
    try {
      add()({ type: 'success', message: `Вы выиграли: ${evt.prize.name} (${evt.prize.price.toFixed(2)})` });
    } catch {
      // no-op
    }
  });

  DomainEventBus.on<DepositMadeEvent>(DomainEventNames.DepositMade, (evt) => {
    try {
      add()({ type: 'success', message: `Депозит успешен: +${evt.amount.toFixed(2)}` });
    } catch {
      // no-op
    }
  });
}

declare global {
  interface Window { __EVENTS_INIT__?: boolean; }
}

if (typeof window !== 'undefined') {
  if (!window.__EVENTS_INIT__) {
    window.__EVENTS_INIT__ = true;
    subscribeOnce();
  }
} else {
  // SSR or non-window env
  subscribeOnce();
}




