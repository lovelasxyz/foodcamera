import { DevLogger } from '@/services/devtools/loggerService';
import { captureError } from '@/services/errorTracking';
import { ValidationError } from '@/infrastructure/validation/validator';

export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical'
}

export interface ApiErrorContext {
	endpoint?: string;
	method?: string;
	requestId?: string;
	userId?: string;
	timestamp?: number;
	retryable?: boolean;
	severity?: ErrorSeverity;
	meta?: Record<string, unknown>;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code: string,
		public readonly context: ApiErrorContext = {},
		public readonly originalError?: Error
	) {
		super(message);
		this.name = 'ApiError';
		Object.setPrototypeOf(this, ApiError.prototype);
	}

	get isRetryable(): boolean {
		return this.context.retryable ?? this.isTransientError();
	}

	get severity(): ErrorSeverity {
		return this.context.severity ?? this.inferSeverity();
	}

	private isTransientError(): boolean {
		// Network errors, timeouts, rate limits, server errors are retryable
		return (
			this.status === 0 || // Network error/timeout
			this.status === 408 || // Request timeout
			this.status === 429 || // Rate limit
			this.status === 503 || // Service unavailable
			this.status === 504 // Gateway timeout
		);
	}

	private inferSeverity(): ErrorSeverity {
		if (this.status >= 500) return ErrorSeverity.HIGH;
		if (this.status === 401 || this.status === 403) return ErrorSeverity.MEDIUM;
		if (this.status === 429) return ErrorSeverity.MEDIUM;
		if (this.status === 400) return ErrorSeverity.LOW;
		return ErrorSeverity.MEDIUM;
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			status: this.status,
			code: this.code,
			context: this.context,
			isRetryable: this.isRetryable,
			severity: this.severity
		};
	}
}

export class NetworkError extends ApiError {
	constructor(message: string, context: ApiErrorContext = {}) {
		super(message, 0, 'NETWORK_ERROR', { ...context, retryable: true, severity: ErrorSeverity.HIGH });
		this.name = 'NetworkError';
	}
}

export class TimeoutError extends ApiError {
	constructor(message: string, context: ApiErrorContext = {}) {
		super(message, 408, 'TIMEOUT', { ...context, retryable: true, severity: ErrorSeverity.MEDIUM });
		this.name = 'TimeoutError';
	}
}

export class AuthenticationError extends ApiError {
	constructor(message: string, context: ApiErrorContext = {}) {
		super(message, 401, 'UNAUTHORIZED', { ...context, retryable: false, severity: ErrorSeverity.HIGH });
		this.name = 'AuthenticationError';
	}
}

export class RateLimitError extends ApiError {
	constructor(
		message: string,
		public readonly retryAfter?: number,
		context: ApiErrorContext = {}
	) {
		super(message, 429, 'RATE_LIMIT', { ...context, retryable: true, severity: ErrorSeverity.MEDIUM });
		this.name = 'RateLimitError';
	}
}

/**
 * Centralized API error handler
 */
export class ApiErrorHandler {
	/**
	 * Normalize any error into an ApiError
	 */
	static normalize(error: unknown, context: ApiErrorContext = {}): ApiError {
		// Already an ApiError
		if (error instanceof ApiError) {
			return error;
		}

		// Validation error
		if (error instanceof ValidationError) {
			return new ApiError(
				error.message,
				400,
				'VALIDATION_ERROR',
				{ ...context, severity: ErrorSeverity.LOW, meta: { errors: error.errors } },
				error
			);
		}

		// Fetch/Network errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return new NetworkError('Network request failed', context);
		}

		// AbortError (timeout)
		if (error instanceof Error && error.name === 'AbortError') {
			return new TimeoutError('Request timeout', context);
		}

		// Generic Error
		if (error instanceof Error) {
			return new ApiError(
				error.message,
				0,
				'UNKNOWN_ERROR',
				{ ...context, severity: ErrorSeverity.MEDIUM },
				error
			);
		}

		// Unknown error type
		return new ApiError(
			String(error),
			0,
			'UNKNOWN_ERROR',
			{ ...context, severity: ErrorSeverity.MEDIUM }
		);
	}

	/**
	 * Handle error with logging and tracking
	 */
	static handle(error: unknown, context: ApiErrorContext = {}): ApiError {
		const apiError = this.normalize(error, context);

		// Log based on severity
		const logContext = {
			...apiError.context,
			status: apiError.status,
			code: apiError.code
		};

		switch (apiError.severity) {
			case ErrorSeverity.CRITICAL:
			case ErrorSeverity.HIGH:
				DevLogger.logError(apiError.message, apiError, logContext);
				break;
			case ErrorSeverity.MEDIUM:
				DevLogger.logWarn(apiError.message, logContext);
				break;
			case ErrorSeverity.LOW:
				DevLogger.logInfo(`API error: ${apiError.message}`, logContext);
				break;
		}

		// Track in error monitoring (only medium+ severity)
		if (apiError.severity !== ErrorSeverity.LOW) {
			captureError(apiError, {
				level: apiError.severity === ErrorSeverity.CRITICAL || apiError.severity === ErrorSeverity.HIGH ? 'error' : 'warn',
				tags: {
					type: 'api',
					code: apiError.code,
					status: String(apiError.status),
					severity: apiError.severity
				},
				extra: logContext
			});
		}

		return apiError;
	}

	/**
	 * Get user-friendly error message
	 */
	static getUserMessage(error: ApiError): string {
		const messages: Record<string, string> = {
			NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
			TIMEOUT: 'Request timed out. Please try again.',
			UNAUTHORIZED: 'Your session has expired. Please log in again.',
			RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
			VALIDATION_ERROR: 'Invalid data provided. Please check your input.',
			UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
		};

		return messages[error.code] || error.message || messages.UNKNOWN_ERROR;
	}

	/**
	 * Determine if error should trigger retry logic
	 */
	static shouldRetry(error: ApiError, attemptCount: number, maxAttempts = 3): boolean {
		if (attemptCount >= maxAttempts) return false;
		return error.isRetryable;
	}

	/**
	 * Calculate retry delay with exponential backoff
	 */
	static getRetryDelay(attemptCount: number, baseDelay = 1000, maxDelay = 30000): number {
		const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
		const jitter = Math.random() * 0.3 * exponentialDelay; // ±30% jitter
		return Math.min(exponentialDelay + jitter, maxDelay);
	}
}
