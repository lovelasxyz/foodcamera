import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import React from 'react';

export const SessionExpiredBanner: React.FC = () => {
  const { sessionExpired, setSessionExpired } = useUIStore();
  const { setToken, loadUser } = useUserStore();
  if (!sessionExpired) return null;
  const retry = async () => {
    setSessionExpired(false);
    // Attempt silent reload if token was refreshed elsewhere (placeholder logic)
    try { await loadUser(); } catch { /* swallow */ }
  };
  const logout = () => {
    setToken(null);
    window.location.reload();
  };
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'#2d1f1f', color:'#fff', padding:'8px 16px', display:'flex', alignItems:'center', gap:12, fontSize:14 }}>
      <span>Сессия истекла. Пожалуйста, обновите авторизацию.</span>
      <button onClick={retry} style={{ background:'#444', color:'#fff', border:'1px solid #666', padding:'4px 10px', borderRadius:4, cursor:'pointer' }}>Повторить</button>
      <button onClick={logout} style={{ background:'#7a1f1f', color:'#fff', border:'1px solid #992f2f', padding:'4px 10px', borderRadius:4, cursor:'pointer' }}>Выйти</button>
    </div>
  );
};

export default SessionExpiredBanner;
