import { useEffect } from 'react';
import { subscribeToCaseUpdates } from '@/services/realtime/casesRealtime';
import { DevLogger } from '@/services/devtools/loggerService';
import { useCasesStore } from '@/store/casesStore';

export const useCasesRealtime = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const loadCases = () => {
      const { loadCases: load } = useCasesStore.getState();
      load()
        .catch((error) => {
          DevLogger.logError('Failed to refresh cases after realtime update', error);
        });
    };

    const subscriptionPromise = subscribeToCaseUpdates(loadCases)
      .catch((error) => {
        DevLogger.logError('Failed to subscribe to cases realtime updates', error);
        return async () => { /* noop */ };
      });

    return () => {
      subscriptionPromise
        .then(async (unsubscribe) => {
          await unsubscribe();
        })
        .catch((error) => {
          DevLogger.logWarn('Failed to clean up cases realtime subscription', {
            message: error instanceof Error ? error.message : undefined,
          });
        });
    };
  }, [enabled]);
};
