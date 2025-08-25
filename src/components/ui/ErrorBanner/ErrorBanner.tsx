import React from 'react';
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, className }) => {
  return (
    <div className={`${styles.errorDisplay} ${className || ''}`}>
      <div className={styles.errorContent}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7" stroke="#FF4444" strokeWidth="1.5" />
          <path d="M8 5V9" stroke="#FF4444" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.5" fill="#FF4444" />
        </svg>
        <div className={styles.errorText}>{message}</div>
      </div>
    </div>
  );
};



