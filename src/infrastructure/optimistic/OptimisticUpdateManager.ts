import { DevLogger } from '@/services/devtools/loggerService';

export interface OptimisticUpdate<T> {
	id: string;
	operationType: string;
	timestamp: number;
	apply(): T;
	rollback(): T;
	confirm(): void;
}

export interface OptimisticOperation<TState, TResult> {
	id?: string;
	type: string;
	execute: () => Promise<TResult>;
	optimistic: (state: TState) => TState;
	onSuccess?: (state: TState, result: TResult) => TState;
	onError?: (state: TState, error: Error) => TState;
}

/**
 * Manager for optimistic UI updates with automatic rollback on failure
 */
export class OptimisticUpdateManager<TState> {
	private pendingUpdates = new Map<string, OptimisticUpdate<TState>>();
	private updateCounter = 0;

	constructor(
		private readonly getState: () => TState,
		private readonly setState: (state: TState) => void
	) {}

	/**
	 * Execute an operation optimistically
	 * 1. Apply optimistic state immediately
	 * 2. Execute async operation
	 * 3. On success: confirm and optionally refine state with server data
	 * 4. On error: rollback to previous state
	 */
	async execute<TResult>(
		operation: OptimisticOperation<TState, TResult>
	): Promise<TResult> {
		const id = operation.id || `opt_${++this.updateCounter}_${Date.now()}`;
		const beforeState = this.getState();

		// Apply optimistic update
		const optimisticState = operation.optimistic(beforeState);
		this.setState(optimisticState);

		const update: OptimisticUpdate<TState> = {
			id,
			operationType: operation.type,
			timestamp: Date.now(),
			apply: () => optimisticState,
			rollback: () => beforeState,
			confirm: () => {
				this.pendingUpdates.delete(id);
				DevLogger.logInfo(`Optimistic update confirmed: ${operation.type}`, { id });
			}
		};

		this.pendingUpdates.set(id, update);
		DevLogger.logInfo(`Optimistic update applied: ${operation.type}`, { id, state: optimisticState });

		try {
			const result = await operation.execute();

			// Success: optionally refine state with server response
			if (operation.onSuccess) {
				const refinedState = operation.onSuccess(this.getState(), result);
				this.setState(refinedState);
			}

			update.confirm();
			return result;
		} catch (error) {
			// Error: rollback
			DevLogger.logError(`Optimistic update failed, rolling back: ${operation.type}`, error as Error, { id });

			const rollbackState = operation.onError
				? operation.onError(beforeState, error as Error)
				: beforeState;

			this.setState(rollbackState);
			this.pendingUpdates.delete(id);

			throw error;
		}
	}

	/**
	 * Manually rollback a specific update
	 */
	rollback(updateId: string): boolean {
		const update = this.pendingUpdates.get(updateId);
		if (!update) return false;

		const rolledBackState = update.rollback();
		this.setState(rolledBackState);
		this.pendingUpdates.delete(updateId);

		DevLogger.logWarn(`Manually rolled back update: ${update.operationType}`, { id: updateId });
		return true;
	}

	/**
	 * Rollback all pending updates (e.g., on connection loss)
	 */
	rollbackAll(): void {
		const updates = Array.from(this.pendingUpdates.values());
		if (updates.length === 0) return;

		DevLogger.logWarn(`Rolling back ${updates.length} pending updates`);

		// Rollback in reverse order (LIFO)
		for (const update of updates.reverse()) {
			const state = update.rollback();
			this.setState(state);
		}

		this.pendingUpdates.clear();
	}

	/**
	 * Get all pending update IDs
	 */
	getPending(): string[] {
		return Array.from(this.pendingUpdates.keys());
	}

	/**
	 * Check if there are pending updates
	 */
	hasPending(): boolean {
		return this.pendingUpdates.size > 0;
	}
}

/**
 * Factory for creating optimistic update managers bound to Zustand stores
 */
export class OptimisticUpdateFactory {
	static forStore<TState>(
		getState: () => TState,
		setState: (updater: (state: TState) => TState) => void
	): OptimisticUpdateManager<TState> {
		return new OptimisticUpdateManager<TState>(
			getState,
			(newState) => setState(() => newState)
		);
	}
}
