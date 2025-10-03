import { HttpClient, RequestOptions } from '@/services/apiClient';
import { ApiErrorHandler, ApiError } from '@/infrastructure/errors/ApiErrorHandler';
import { DevLogger } from '@/services/devtools/loggerService';

export interface RetryConfig {
	maxAttempts?: number;
	baseDelay?: number;
	maxDelay?: number;
	retryableStatuses?: number[];
}

/**
 * HTTP client wrapper with automatic retry logic
 */
export class RetryableHttpClient implements HttpClient {
	private readonly defaultConfig: Required<RetryConfig> = {
		maxAttempts: 3,
		baseDelay: 1000,
		maxDelay: 30000,
		retryableStatuses: [408, 429, 500, 502, 503, 504]
	};

	constructor(
		private readonly innerClient: HttpClient,
		private readonly config: RetryConfig = {}
	) {}

	async get<T>(url: string, opts?: RequestOptions): Promise<T> {
		return this.executeWithRetry(() => this.innerClient.get<T>(url, opts), 'GET', url);
	}

	async post<T>(url: string, body?: any, opts?: RequestOptions): Promise<T> {
		return this.executeWithRetry(() => this.innerClient.post<T>(url, body, opts), 'POST', url);
	}

	private async executeWithRetry<T>(
		operation: () => Promise<T>,
		method: string,
		url: string
	): Promise<T> {
		const maxAttempts = this.config.maxAttempts ?? this.defaultConfig.maxAttempts;
		let lastError: ApiError | undefined;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await operation();
			} catch (error) {
				const apiError = ApiErrorHandler.normalize(error, { method, endpoint: url });

				// Don't retry if it's the last attempt
				if (attempt === maxAttempts) {
					throw apiError;
				}

				// Check if error is retryable
				if (!ApiErrorHandler.shouldRetry(apiError, attempt, maxAttempts)) {
					throw apiError;
				}

				lastError = apiError;

				// Calculate delay
				const delay = ApiErrorHandler.getRetryDelay(
					attempt,
					this.config.baseDelay ?? this.defaultConfig.baseDelay,
					this.config.maxDelay ?? this.defaultConfig.maxDelay
				);

				DevLogger.logWarn(`Request failed, retrying (${attempt}/${maxAttempts}) after ${delay}ms`, {
					method,
					url,
					error: apiError.message,
					status: apiError.status
				});

				await this.sleep(delay);
			}
		}

		// Should never reach here, but TypeScript needs it
		throw lastError || new Error('Unexpected retry failure');
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
