import { useEffect, useState } from 'react';

export const useOnlineStatus = (): boolean => {
  const queryForcingOffline = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('offline') === '1';
  const localStorageForcingOffline = typeof window !== 'undefined' && window.localStorage?.getItem('DEBUG_FORCE_OFFLINE') === '1';
  const initialOnline = (typeof navigator !== 'undefined' ? navigator.onLine : true) && !queryForcingOffline && !localStorageForcingOffline;
  const [isOnline, setIsOnline] = useState<boolean>(initialOnline);

  useEffect(() => {
    const handleOnline = () => {
      if (queryForcingOffline || localStorageForcingOffline) return;
      setIsOnline(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryForcingOffline, localStorageForcingOffline]);

  return isOnline;
};


