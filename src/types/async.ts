export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export class UserFriendlyError extends Error {
  public readonly userMessage: string;
  public readonly recoveryAction?: () => void;
  constructor(message: string, userMessage: string, recoveryAction?: () => void) {
    super(message);
    this.name = 'UserFriendlyError';
    this.userMessage = userMessage;
    this.recoveryAction = recoveryAction;
  }
}


