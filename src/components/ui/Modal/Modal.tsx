import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { ModalProps } from '@/types/ui';
import styles from './Modal.module.css';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={clsx(styles.modal, styles[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}; 