import { DevLogger } from '@/services/devtools/loggerService';

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
	url?: string;
	reconnectDelay?: number;
	maxReconnectAttempts?: number;
	heartbeatInterval?: number;
}

export type EventHandler<T = any> = (payload: T, event: RealtimeEvent<T>) => void;

/**
 * Real-time synchronization manager using WebSocket or Server-Sent Events
 */
export class RealtimeSync {
	private ws: WebSocket | null = null;
	private eventSource: EventSource | null = null;
	private handlers = new Map<RealtimeSyncEventType, Set<EventHandler>>();
	private reconnectAttempts = 0;
	private reconnectTimer: number | null = null;
	private heartbeatTimer: number | null = null;
	private isConnecting = false;
	private isManualDisconnect = false;

	private readonly config: Required<RealtimeSyncConfig>;

	constructor(config: RealtimeSyncConfig = {}) {
		this.config = {
			url: config.url || this.buildDefaultUrl(),
			reconnectDelay: config.reconnectDelay ?? 3000,
			maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
			heartbeatInterval: config.heartbeatInterval ?? 30000
		};
	}

	private buildDefaultUrl(): string {
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.host;
		return `${protocol}//${host}/ws`;
	}

	/**
	 * Connect to real-time sync server (prefer WebSocket, fallback to SSE)
	 */
	connect(token?: string): void {
		if (this.ws || this.eventSource || this.isConnecting) {
			DevLogger.logWarn('Already connected or connecting to real-time sync');
			return;
		}

		this.isConnecting = true;
		this.isManualDisconnect = false;

		// Try WebSocket first
		try {
			const url = token
				? `${this.config.url}?token=${encodeURIComponent(token)}`
				: this.config.url;

			this.ws = new WebSocket(url);

			this.ws.onopen = () => {
				this.isConnecting = false;
				this.reconnectAttempts = 0;
				DevLogger.logInfo('WebSocket connected');
				this.emit('connection.status', { connected: true, transport: 'websocket' });
				this.startHeartbeat();
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as RealtimeEvent;
					this.handleEvent(data);
				} catch (error) {
					DevLogger.logError('Failed to parse WebSocket message', error as Error, { raw: event.data });
				}
			};

			this.ws.onerror = (error) => {
				DevLogger.logError('WebSocket error', error as any);
			};

			this.ws.onclose = () => {
				this.isConnecting = false;
				this.cleanup();
				DevLogger.logWarn('WebSocket disconnected');
				this.emit('connection.status', { connected: false, transport: 'websocket' });

				if (!this.isManualDisconnect) {
					this.scheduleReconnect(token);
				}
			};
		} catch (error) {
			this.isConnecting = false;
			DevLogger.logError('Failed to create WebSocket', error as Error);
			// Fallback to SSE (if implemented)
		}
	}

	/**
	 * Disconnect from real-time sync
	 */
	disconnect(): void {
		this.isManualDisconnect = true;
		this.cleanup();
		DevLogger.logInfo('Disconnected from real-time sync');
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
	 * Send message to server (WebSocket only)
	 */
	send(event: RealtimeSyncEventType, payload: any): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			DevLogger.logWarn('Cannot send message: WebSocket not connected');
			return;
		}

		const message: RealtimeEvent = {
			type: event,
			payload,
			timestamp: Date.now()
		};

		this.ws.send(JSON.stringify(message));
	}

	/**
	 * Get connection status
	 */
	isConnected(): boolean {
		return (
			(this.ws !== null && this.ws.readyState === WebSocket.OPEN) ||
			(this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN)
		);
	}

	private handleEvent(event: RealtimeEvent): void {
		DevLogger.logInfo(`Received real-time event: ${event.type}`, { payload: event.payload });

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

	private startHeartbeat(): void {
		this.stopHeartbeat();

		this.heartbeatTimer = window.setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.send('connection.status' as any, { type: 'ping' });
			}
		}, this.config.heartbeatInterval);
	}

	private stopHeartbeat(): void {
		if (this.heartbeatTimer !== null) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	private scheduleReconnect(token?: string): void {
		if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
			DevLogger.logError('Max reconnect attempts reached');
			return;
		}

		this.reconnectAttempts++;
		const delay = this.config.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

		DevLogger.logInfo(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

		this.reconnectTimer = window.setTimeout(() => {
			this.connect(token);
		}, delay);
	}

	private cleanup(): void {
		this.stopHeartbeat();

		if (this.reconnectTimer !== null) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
	}
}

// Singleton instance
let realtimeSyncInstance: RealtimeSync | null = null;

export const getRealtimeSync = (): RealtimeSync => {
	if (!realtimeSyncInstance) {
		realtimeSyncInstance = new RealtimeSync();
	}
	return realtimeSyncInstance;
};
