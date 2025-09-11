import React, { useEffect, useState } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { clsx } from 'clsx';
import { X, ArrowLeft } from 'lucide-react';
import { ModalProps } from '@/types/ui';
import styles from './Modal.module.css';

type Variant = 'default' | 'bottomSheet';

interface ExtendedModalProps extends ModalProps {
  subtitle?: string;
  onBack?: () => void;
  variant?: Variant;
  keyboardActive?: boolean;
  bottomSheetAnimated?: boolean;
}

export const Modal: React.FC<ExtendedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  subtitle,
  onBack,
  variant = 'default',
  keyboardActive = false,
  bottomSheetAnimated = false,
  className,
  overlayClassName
}) => {
  const ANIMATION_MS = 300;
  const [shouldRender, setShouldRender] = useState<boolean>(isOpen);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isEntering, setIsEntering] = useState<boolean>(false);
  const animationEnabled = variant === 'bottomSheet' && bottomSheetAnimated;
  useBodyScrollLock(animationEnabled ? shouldRender : isOpen);

  // Keep mounted during exit animation
  useEffect(() => {
    if (!animationEnabled) {
      setShouldRender(isOpen);
      return;
    }
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, ANIMATION_MS);
      return () => window.clearTimeout(timer);
    }
  }, [animationEnabled, isOpen, shouldRender]);

  // Body scroll lock handled by hook above

  // Coordinate enter animation on next frame so CSS transitions run
  useEffect(() => {
    if (!animationEnabled) return;
    if (!shouldRender) return;
    let raf = 0;
    setIsEntering(false);
    raf = window.requestAnimationFrame(() => {
      setIsEntering(true);
    });
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [animationEnabled, shouldRender]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const mounted = animationEnabled ? shouldRender : isOpen;
    if (mounted) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [animationEnabled, shouldRender, isOpen, onClose]);

  const mounted = animationEnabled ? shouldRender : isOpen;
  if (!mounted) return null;

  return (
    <div
      className={clsx(
        styles.overlay,
        { [styles.overlayBottom]: variant === 'bottomSheet' },
        animationEnabled && { [styles.preEnter]: variant === 'bottomSheet' && !isClosing && !isEntering },
        animationEnabled && { [styles.overlayHidden]: isClosing || !isEntering },
        animationEnabled && { [styles.overlayVisible]: !isClosing && isEntering },
        overlayClassName
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          styles.modal,
          styles[size],
          { [styles.modalBottom]: variant === 'bottomSheet' },
          animationEnabled && { [styles.preEnter]: variant === 'bottomSheet' && !isClosing && !isEntering },
          animationEnabled && { [styles.slideIn]: variant === 'bottomSheet' && !isClosing && isEntering },
          animationEnabled && { [styles.slideOut]: variant === 'bottomSheet' && isClosing },
          { [styles.keyboardActive]: keyboardActive },
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            {onBack && (
              <button className={styles.backButton} onClick={onBack} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
            )}
            {title && <h2 className={styles.title}>{title}</h2>}
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}; 