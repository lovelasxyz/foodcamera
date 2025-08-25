import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './SuccessModal.module.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  autoCloseMs?: number;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Success',
  subtitle,
  autoCloseMs
}) => {
  useEffect(() => {
    if (!isOpen) return;
    if (!autoCloseMs) return;
    const timer = window.setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, autoCloseMs, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className={styles.container}>
        <div className={styles.animWrapper}>
          <svg className={styles.checkSvg} viewBox="0 0 52 52" aria-hidden="true">
            <circle className={styles.checkCircle} cx="26" cy="26" r="25" fill="none" />
            <path
              className={styles.checkMark}
              fill="none"
              d="M14 27 L22 34 L38 18"
            />
          </svg>
        </div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        {!autoCloseMs && (
          <button className={styles.okButton} onClick={onClose}>OK</button>
        )}
      </div>
    </Modal>
  );
};


