// Централизованная обработка ошибок
class ErrorHandler {
  constructor() {
    this.listeners = [];
    this.isInitialized = false;
  }

  // Инициализация обработчика ошибок
  init() {
    if (this.isInitialized) return;
    
    // Обработчик ошибок JavaScript
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        type: 'javascript',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        stack: event.error?.stack
      });
    });

    // Обработчик необработанных промисов
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        type: 'promise',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        stack: event.reason?.stack
      });
    });

    this.isInitialized = true;
  }

  // Добавление слушателя ошибок
  addListener(listener) {
    this.listeners.push(listener);
  }

  // Удаление слушателя ошибок
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Обработка ошибки
  handleError(errorInfo) {
    // Уведомляем всех слушателей
    this.listeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error in error handler listener:', err);
      }
    });
  }

  // Создание пользовательской ошибки
  createError(message, context = {}) {
    const error = new Error(message);
    error.context = context;
    return error;
  }

  // Безопасное выполнение функции
  async safeExecute(fn, context = '') {
    try {
      return await fn();
    } catch (error) {
      this.handleError({ 
        message: error?.message || error?.toString() || 'Unknown error',
        type: 'safeExecute', 
        context,
        stack: error?.stack
      });
      throw error;
    }
  }

  // Безопасное выполнение синхронной функции
  safeExecuteSync(fn, context = '') {
    try {
      return fn();
    } catch (error) {
      this.handleError({ 
        message: error?.message || error?.toString() || 'Unknown error',
        type: 'safeExecuteSync', 
        context,
        stack: error?.stack
      });
      throw error;
    }
  }
}

// Создаем глобальный экземпляр
const errorHandler = new ErrorHandler();

// Экспортируем функции для удобства
export const handleError = (error) => errorHandler.handleError(error);
export const createError = (message, context) => errorHandler.createError(message, context);
export const safeExecute = (fn, context) => errorHandler.safeExecute(fn, context);
export const safeExecuteSync = (fn, context) => errorHandler.safeExecuteSync(fn, context);
export const addErrorListener = (callback) => errorHandler.addListener(callback);
export const removeErrorListener = (callback) => errorHandler.removeListener(callback);

export default errorHandler; 