import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { DevLogger } from '@/services/devtools/loggerService';
import { isApiEnabled, resolveRealtimeUrl } from '@/config/api.config';
import { shouldUseGuestMode } from '@/utils/environment';

let connection: HubConnection | null = null;
let connectionPromise: Promise<HubConnection> | null = null;
let subscriberCount = 0;

const buildConnection = (): HubConnection => {
  return new HubConnectionBuilder()
    .withUrl(resolveRealtimeUrl('/hubs/cases'), { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();
};

const ensureConnection = async (): Promise<HubConnection> => {
  if (connection) {
    return connection;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      const hub = buildConnection();

      hub.onclose((error) => {
        if (error) {
          DevLogger.logWarn('Cases hub connection closed with error', {
            message: error.message,
            stack: error.stack,
          });
        } else {
          DevLogger.logInfo('Cases hub connection closed');
        }
      });

      hub.onreconnecting((error) => {
        DevLogger.logWarn('Cases hub reconnecting', error instanceof Error
          ? { message: error.message }
          : undefined);
      });

      hub.onreconnected((connectionId) => {
        DevLogger.logInfo('Cases hub reconnected', { connectionId });
      });

      await hub.start();
      DevLogger.logInfo('Cases hub connection established');
      connection = hub;
      return hub;
    })().catch((error) => {
      DevLogger.logError('Failed to establish cases hub connection', error);
      connectionPromise = null;
      connection = null;
      throw error;
    });
  }

  return connectionPromise;
};

const stopConnection = async () => {
  if (!connection) {
    connectionPromise = null;
    return;
  }

  const hub = connection;
  connection = null;
  connectionPromise = null;

  try {
    await hub.stop();
    DevLogger.logInfo('Cases hub connection stopped');
  } catch (error) {
    DevLogger.logError('Failed to stop cases hub connection gracefully', error);
  }
};

export type CasesRealtimeUnsubscribe = () => Promise<void>;

export const subscribeToCaseUpdates = async (handler: () => void): Promise<CasesRealtimeUnsubscribe> => {
  if (!isApiEnabled() || shouldUseGuestMode()) {
    return async () => {};
  }

  const hub = await ensureConnection();

  const safeHandler = () => {
    try {
      handler();
    } catch (error) {
      DevLogger.logError('Cases hub handler threw', error);
    }
  };

  hub.on('CasesUpdated', safeHandler);
  hub.on('CaseDeleted', safeHandler);

  subscriberCount += 1;

  return async () => {
    hub.off('CasesUpdated', safeHandler);
    hub.off('CaseDeleted', safeHandler);
    subscriberCount = Math.max(0, subscriberCount - 1);

    if (subscriberCount === 0) {
      await stopConnection();
    }
  };
};
