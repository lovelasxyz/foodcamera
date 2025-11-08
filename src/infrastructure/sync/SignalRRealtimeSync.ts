import * as signalR from '@microsoft/signalr';
import { DevLogger } from '@/services/devtools/loggerService';
import { resolveRealtimeUrl } from '@/config/api.config';

export type RealtimeSyncEventType =
	| 'balance.updated'
	| 'inventory.item_added'
	| 'inventory.item_removed'
	| 'case.opened'
	| 'spin.completed'
	| 'user.stats_updated'
	| 'connection.status';

export interface RealtimeEvent<T = any> {
	type: RealtimeSyncEventType;
	payload: T;
	timestamp: number;
	userId?: string;
}

export interface RealtimeSyncConfig {
	hubUrl?: string;
	reconnectDelay?: number;
	maxReconnectAttempts?: number;
}

export type EventHandler<T = any> = (payload: T, event: RealtimeEvent<T>) => void;

/**
 * Real-time synchronization manager using SignalR
 */
export class SignalRRealtimeSync {
	private connection: signalR.HubConnection | null = null;
	private handlers = new Map<RealtimeSyncEventType, Set<EventHandler>>();

	private readonly config: Required<RealtimeSyncConfig>;

	constructor(config: RealtimeSyncConfig = {}) {
		this.config = {
			hubUrl: config.hubUrl || resolveRealtimeUrl('/hubs/cases'),
			reconnectDelay: config.reconnectDelay ?? 3000,
			maxReconnectAttempts: config.maxReconnectAttempts ?? 10
		};
	}

	/**
	 * Connect to SignalR hub
	 */
	async connect(token?: string): Promise<void> {
		if (this.connection) {
			DevLogger.logWarn('Already connected to SignalR hub');
			return;
		}

		// Build SignalR connection
		const builder = new signalR.HubConnectionBuilder()
			.withUrl(this.config.hubUrl, {
				accessTokenFactory: () => token || '',
				skipNegotiation: false,
				transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
			})
			.withAutomaticReconnect({
				nextRetryDelayInMilliseconds: (retryContext) => {
					if (retryContext.previousRetryCount >= this.config.maxReconnectAttempts) {
						DevLogger.logError('Max reconnect attempts reached');
						return null; // Stop reconnecting
					}
					const delay = this.config.reconnectDelay * Math.pow(1.5, retryContext.previousRetryCount);
					DevLogger.logInfo(`SignalR reconnecting in ${delay}ms (attempt ${retryContext.previousRetryCount + 1}/${this.config.maxReconnectAttempts})`);
					return delay;
				}
			})
			.configureLogging(signalR.LogLevel.Information);

		this.connection = builder.build();

		// Setup event handlers
		this.setupConnectionHandlers();
		this.setupServerEventHandlers();

		try {
			await this.connection.start();
			DevLogger.logInfo('SignalR connected successfully');
			this.emit('connection.status', { connected: true, transport: 'signalr' });
		} catch (error) {
			DevLogger.logError('Failed to connect to SignalR hub', error as Error);
			this.connection = null;
			throw error;
		}
	}

	/**
	 * Disconnect from SignalR hub
	 */
	async disconnect(): Promise<void> {
		if (this.connection) {
			try {
				await this.connection.stop();
				DevLogger.logInfo('Disconnected from SignalR hub');
			} catch (error) {
				DevLogger.logError('Error disconnecting from SignalR hub', error as Error);
			} finally {
				this.connection = null;
			}
		}
	}

	/**
	 * Subscribe to events
	 */
	subscribe<T = any>(event: RealtimeSyncEventType, handler: EventHandler<T>): () => void {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, new Set());
		}
		this.handlers.get(event)!.add(handler as EventHandler);

		// Return unsubscribe function
		return () => this.unsubscribe(event, handler);
	}

	/**
	 * Unsubscribe from events
	 */
	unsubscribe(event: RealtimeSyncEventType, handler: EventHandler): void {
		const handlers = this.handlers.get(event);
		if (handlers) {
			handlers.delete(handler);
			if (handlers.size === 0) {
				this.handlers.delete(event);
			}
		}
	}

	/**
	 * Send message to server
	 */
	async send(method: string, ...args: any[]): Promise<void> {
		if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
			DevLogger.logWarn('Cannot send message: SignalR not connected');
			return;
		}

		try {
			await this.connection.invoke(method, ...args);
			DevLogger.logInfo(`SignalR message sent: ${method}`, { args });
		} catch (error) {
			DevLogger.logError(`Failed to send SignalR message: ${method}`, error as Error);
		}
	}

	/**
	 * Get connection status
	 */
	isConnected(): boolean {
		return this.connection !== null && this.connection.state === signalR.HubConnectionState.Connected;
	}

	private setupConnectionHandlers(): void {
		if (!this.connection) return;

		this.connection.onclose((error) => {
			DevLogger.logWarn('SignalR connection closed', { error });
			this.emit('connection.status', { connected: false, transport: 'signalr' });
		});

		this.connection.onreconnecting((error) => {
			DevLogger.logWarn('SignalR reconnecting...', { error });
			this.emit('connection.status', { connected: false, reconnecting: true, transport: 'signalr' });
		});

		this.connection.onreconnected((connectionId) => {
			DevLogger.logInfo('SignalR reconnected', { connectionId });
			this.emit('connection.status', { connected: true, transport: 'signalr' });
		});
	}

	private setupServerEventHandlers(): void {
		if (!this.connection) return;

		// Register handlers for each event type
		// The server will call these methods when events occur

		this.connection.on('BalanceUpdated', (data: any) => {
			this.handleEvent({
				type: 'balance.updated',
				payload: data,
				timestamp: Date.now()
			});
		});

		this.connection.on('InventoryItemAdded', (data: any) => {
			this.handleEvent({
				type: 'inventory.item_added',
				payload: data,
				timestamp: Date.now()
			});
		});

		this.connection.on('InventoryItemRemoved', (data: any) => {
			this.handleEvent({
				type: 'inventory.item_removed',
				payload: data,
				timestamp: Date.now()
			});
		});

		this.connection.on('CaseOpened', (data: any) => {
			this.handleEvent({
				type: 'case.opened',
				payload: data,
				timestamp: Date.now()
			});
		});

		this.connection.on('SpinCompleted', (data: any) => {
			this.handleEvent({
				type: 'spin.completed',
				payload: data,
				timestamp: Date.now()
			});
		});

		this.connection.on('UserStatsUpdated', (data: any) => {
			this.handleEvent({
				type: 'user.stats_updated',
				payload: data,
				timestamp: Date.now()
			});
		});
	}

	private handleEvent(event: RealtimeEvent): void {
		DevLogger.logInfo(`Received SignalR event: ${event.type}`, { payload: event.payload });

		const handlers = this.handlers.get(event.type);
		if (handlers) {
			handlers.forEach(handler => {
				try {
					handler(event.payload, event);
				} catch (error) {
					DevLogger.logError(`Error in event handler for ${event.type}`, error as Error);
				}
			});
		}
	}

	private emit(event: RealtimeSyncEventType, payload: any): void {
		this.handleEvent({
			type: event,
			payload,
			timestamp: Date.now()
		});
	}
}

// Singleton instance
let realtimeSyncInstance: SignalRRealtimeSync | null = null;

export const getSignalRRealtimeSync = (): SignalRRealtimeSync => {
	if (!realtimeSyncInstance) {
		realtimeSyncInstance = new SignalRRealtimeSync();
	}
	return realtimeSyncInstance;
};
