import React from 'react';
import styles from './Loader.module.css';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  text = 'Loading...',
  size = 'md',
  className
}) => {
  return (
    <div className={`${styles.loader} ${styles[size]} ${className || ''}`}>
      <div className={styles.spinner}>
        <div className={styles.circle}></div>
      </div>
      <div className={styles.text}>{text}</div>
    </div>
  );
}; 