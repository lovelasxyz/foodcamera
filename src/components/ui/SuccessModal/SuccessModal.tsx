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
    if (!isOpen || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [isOpen, autoCloseMs, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className={styles.container}>
        <div className={styles.animWrapper}>
          <svg className={styles.checkSvg} viewBox="0 0 52 52">
            <circle className={styles.checkCircle} cx="26" cy="26" r="25" fill="none" />
            <path className={styles.checkMark} fill="none" d="M14 27l7 7 17-17" />
          </svg>
        </div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        <button className={styles.okButton} onClick={onClose}>OK</button>
      </div>
    </Modal>
  );
};


