export class AppError extends Error {
  public readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class NetworkError extends AppError {
  public readonly status?: number;
  constructor(message = 'Network error', status?: number) {
    super(message, 'NETWORK_ERROR');
    this.status = status;
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message = 'Insufficient funds') {
    super(message, 'INSUFFICIENT_FUNDS');
  }
}

export class ValidationError extends AppError {
  public readonly details?: Record<string, string>;
  constructor(message = 'Validation failed', details?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR');
    this.details = details;
  }
}




