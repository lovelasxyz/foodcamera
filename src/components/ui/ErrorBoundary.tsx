import React from 'react';
import { DevLogger } from '@/services/devtools/loggerService';
import { captureError } from '@/services/errorTracking';

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error } as State;
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // TODO: send to remote logger/analytics
    // eslint-disable-next-line no-console
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
    try { DevLogger.logError('ErrorBoundary captured error', error, { info }); } catch { /* ignore */ }
    try { captureError(error, { level: 'error', tags: { scope: 'ErrorBoundary' }, extra: { info } }); } catch { /* ignore */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }} role="alert">
          <h2>Что-то пошло не так</h2>
          <p>Произошла ошибка приложения. Пожалуйста, обновите страницу или обратитесь в поддержку.</p>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
