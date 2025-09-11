import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui/Modal';
import styles from './SuccessModal.module.css';
import { useI18n } from '@/i18n';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  autoCloseMs?: number;
  // Visual overrides (scoped to this modal instance)
  className?: string; // forwarded to Modal
  overlayClassName?: string; // forwarded to Modal
  containerClassName?: string;
  subtitleClassName?: string;
  okButtonClassName?: string;
  // Content customization
  okLabel?: string;
  actions?: React.ReactNode; // custom actions area; overrides default OK button
  onOk?: () => void; // defaults to onClose
  okButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Success',
  subtitle,
  autoCloseMs,
  className,
  overlayClassName,
  containerClassName,
  subtitleClassName,
  okButtonClassName,
  okLabel,
  actions,
  onOk,
  okButtonProps
}) => {
  const { t } = useI18n();
  useEffect(() => {
    if (!isOpen) return;
    if (!autoCloseMs) return;
    const timer = window.setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, autoCloseMs, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('success.title')}
      size="sm"
      className={className}
      overlayClassName={overlayClassName}
    >
      <div className={clsx(styles.container, containerClassName)}>
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
        {subtitle && <div className={clsx(styles.subtitle, subtitleClassName)}>{subtitle}</div>}
        {actions ?? (!autoCloseMs && (
          <button
            {...okButtonProps}
            className={clsx(styles.okButton, okButtonProps?.className, okButtonClassName)}
            onClick={onOk ?? onClose}
          >
            {okLabel ?? t('success.ok')}
          </button>
        ))}
      </div>
    </Modal>
  );
};


