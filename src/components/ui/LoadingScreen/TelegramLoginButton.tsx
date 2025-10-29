import React, { useEffect, useMemo, useRef } from 'react';
import { TelegramLoginAuthData } from '@/types/telegram';
import styles from './LoadingScreen.module.css';

interface TelegramLoginButtonProps {
  botUsername: string;
  lang: string;
  requestAccess?: 'write' | 'read';
  onAuth: (payload: TelegramLoginAuthData) => void;
}

export const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botUsername,
  lang,
  requestAccess = 'write',
  onAuth,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackName = useMemo(() => `TelegramLoginWidget_onAuth_${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const container = containerRef.current;
    const sanitizedBot = botUsername.trim().replace(/^@/, '');

    if (!container || !sanitizedBot) {
      return;
    }

    container.innerHTML = '';

    (window as any)[callbackName] = (payload: TelegramLoginAuthData) => {
      onAuth(payload);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-telegram-login', sanitizedBot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', callbackName);
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-lang', lang);

    container.appendChild(script);

    return () => {
      if ((window as any)[callbackName]) {
        try { delete (window as any)[callbackName]; } catch { /* ignore */ }
      }
      container.innerHTML = '';
    };
  }, [botUsername, lang, requestAccess, callbackName, onAuth]);

  return <div ref={containerRef} className={styles.telegramLoginContainer} />;
};
