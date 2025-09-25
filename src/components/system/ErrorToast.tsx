import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';

export const ErrorToast: React.FC = () => {
  const { lastError, setLastError } = useUIStore();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (lastError) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); setLastError(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [lastError, setLastError]);
  if (!lastError || !visible) return null;
  return (
    <div style={{ position:'fixed', bottom:20, right:20, background:'#2a2a30', color:'#fff', padding:'12px 16px', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.3)', fontSize:14, zIndex:1000 }}>
      <strong style={{ display:'block', marginBottom:4 }}>Ошибка</strong>
      <span>{lastError.message}</span>
    </div>
  );
};

export default ErrorToast;