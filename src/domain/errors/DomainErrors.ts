export class DomainError extends Error {
  constructor(message?: string) {
    super(message || 'Domain error');
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message?: string) {
    super(message || 'Not found');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message?: string) {
    super(message || 'Validation error');
    this.name = 'ValidationError';
  }
}

export default DomainError;
