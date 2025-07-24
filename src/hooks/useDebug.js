import { useEffect, useRef, useCallback } from 'react';

// Хук для отладки компонентов
export const useDebug = (componentName, props = {}) => {
  const renderCount = useRef(0);
  const prevProps = useRef({});

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${componentName}] Render #${renderCount.current}`, {
        props,
        prevProps: prevProps.current,
        timestamp: new Date().toISOString()
      });
    }
    
    prevProps.current = props;
  });

  // Функция для логирования значений
  const log = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${componentName}] ${message}`, data);
    }
  }, [componentName]);

  // Функция для логирования ошибок
  const logError = useCallback((message, error) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`[${componentName}] ${message}`, error);
    }
  }, [componentName]);

  // Функция для логирования предупреждений
  const logWarning = useCallback((message, data) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[${componentName}] ${message}`, data);
    }
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    log,
    logError,
    logWarning
  };
};

// Хук для отладки производительности
export const usePerformanceDebug = (componentName) => {
  const startTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    const currentTime = performance.now();
    const renderDuration = currentTime - lastRenderTime.current;
    const totalDuration = currentTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${componentName}] Performance:`, {
        renderDuration: `${renderDuration.toFixed(2)}ms`,
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    lastRenderTime.current = currentTime;
  });

  return {
    getRenderDuration: () => performance.now() - lastRenderTime.current,
    getTotalDuration: () => performance.now() - startTime.current
  };
};

// Хук для отладки состояния
export const useStateDebug = (state, stateName = 'state') => {
  const prevState = useRef(state);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && JSON.stringify(prevState.current) !== JSON.stringify(state)) {
      // eslint-disable-next-line no-console
      console.log(`[${stateName}] State changed:`, {
        previous: prevState.current,
        current: state,
        timestamp: new Date().toISOString()
      });
    }
    
    prevState.current = state;
  }, [state, stateName]);

  return prevState.current;
};

// Утилита для отладки API запросов
export const debugApiCall = async (apiCall, callName = 'API Call') => {
  const startTime = performance.now();
  
  try {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${callName}] Starting...`);
    }
    
    const result = await apiCall();
    
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${callName}] Success (${duration.toFixed(2)}ms):`, result);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`[${callName}] Error (${duration.toFixed(2)}ms):`, error);
    }
    
    throw error;
  }
};

// Глобальная функция для включения/выключения отладки
export const setDebugMode = (enabled) => {
  if (typeof window !== 'undefined') {
    window.__DEBUG_MODE__ = enabled;
  }
};

// Проверка режима отладки
export const isDebugMode = () => {
  return process.env.NODE_ENV === 'development' || 
         (typeof window !== 'undefined' && window.__DEBUG_MODE__);
}; 