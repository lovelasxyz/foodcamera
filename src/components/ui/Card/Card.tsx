import React from 'react';
import { clsx } from 'clsx';
import { CardProps } from '@/types/ui';
import styles from './Card.module.css';

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        {
          [styles.clickable]: onClick
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}; 