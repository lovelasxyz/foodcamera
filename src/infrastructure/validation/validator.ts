import { ZodSchema, ZodError } from 'zod';
import { DevLogger } from '@/services/devtools/loggerService';
import { captureError } from '@/services/errorTracking';

export class ValidationError extends Error {
	constructor(
		message: string,
		public readonly errors: Array<{ path: string; message: string }>,
		public readonly rawData?: unknown
	) {
		super(message);
		this.name = 'ValidationError';
	}
}

export class ApiValidator {
	/**
	 * Validates data against a Zod schema with detailed error reporting
	 */
	static validate<T>(schema: ZodSchema<T>, data: unknown, context?: string): T {
		try {
			return schema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				const errors = error.errors.map(err => ({
					path: err.path.join('.'),
					message: err.message
				}));

				const validationError = new ValidationError(
					`Validation failed${context ? ` for ${context}` : ''}: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`,
					errors,
					data
				);

				DevLogger.logError(`Validation failed${context ? ` (${context})` : ''}`, validationError, { data, errors });
				captureError(validationError, {
					level: 'error',
					tags: { type: 'validation', context: context || 'unknown' },
					extra: { zodErrors: errors, rawData: data }
				});

				throw validationError;
			}
			throw error;
		}
	}

	/**
	 * Safe validation that returns default value on error instead of throwing
	 */
	static safeParse<T>(
		schema: ZodSchema<T>,
		data: unknown,
		fallback: T,
		context?: string
	): T {
		try {
			return this.validate(schema, data, context);
		} catch (error) {
			DevLogger.logWarn(`Validation failed, using fallback${context ? ` (${context})` : ''}`, { error, fallback });
			return fallback;
		}
	}

	/**
	 * Validates array responses with partial success tolerance
	 * Returns only valid items and logs invalid ones
	 */
	static validateArray<T>(
		itemSchema: ZodSchema<T>,
		data: unknown[],
		context?: string
	): { valid: T[]; invalid: number } {
		const valid: T[] = [];
		let invalid = 0;

		data.forEach((item, index) => {
			try {
				valid.push(this.validate(itemSchema, item, `${context}[${index}]`));
			} catch (error) {
				invalid++;
				DevLogger.logWarn(`Skipping invalid array item at index ${index}`, { item, error });
			}
		});

		if (invalid > 0) {
			DevLogger.logWarn(`Array validation completed with ${invalid} invalid items out of ${data.length}`, { context });
		}

		return { valid, invalid };
	}
}
