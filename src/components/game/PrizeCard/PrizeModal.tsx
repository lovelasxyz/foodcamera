import React from 'react';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui/Modal';

import styles from './PrizeModal.module.css';

interface PrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  image: string;
  description?: React.ReactNode;
  rarityLabelLeft?: string; // e.g. "Редкость"
  rarityValue?: string;     // e.g. "Легендарный"
  priceLabelLeft?: string;  // e.g. "Цена"
  priceValue?: string;      // formatted price
  rows?: Array<{ label: React.ReactNode; value: React.ReactNode }>; // generic label/value rows

  // Override classes for scoped styling per-instance
  className?: string;
  overlayClassName?: string;
  containerClassName?: string;
  gridClassName?: string;
  imageClassName?: string;
  descriptionClassName?: string;
  actionsClassName?: string;

  // Custom actions; if omitted, no actions are rendered here
  actions?: React.ReactNode;
}

export const PrizeModal: React.FC<PrizeModalProps> = ({
  isOpen,
  onClose,
  title,
  image,
  description,
  rarityLabelLeft,
  rarityValue,
  priceLabelLeft,
  priceValue,
  rows,
  className,
  overlayClassName,
  containerClassName,
  gridClassName,
  imageClassName,
  descriptionClassName,
  actionsClassName,
  actions
}) => {
  const defaultDescription =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  const resolvedDescription = description === undefined ? defaultDescription : description;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" className={className} overlayClassName={overlayClassName}>
      <div className={clsx(styles.container, containerClassName)}>
        <div className={styles.imageRow}>
                <img src={image} alt={title} className={clsx(styles.image, imageClassName)} />
        </div>
        {resolvedDescription && (
          <div className={clsx(styles.description, descriptionClassName)}>
            {resolvedDescription}
          </div>
        )}
        <div className={clsx(styles.grid, gridClassName)}>
          {rows?.map((r, idx) => (
            <React.Fragment key={idx}>
              <div className={styles.labelLeft}>{r.label}</div>
              <div className={styles.valueRight}>{r.value}</div>
            </React.Fragment>
          ))}
          {!rows && (
            <>
              {rarityLabelLeft && <div className={styles.labelLeft}>{rarityLabelLeft}</div>}
              {rarityValue && <div className={styles.valueRight}>{rarityValue}</div>}
              {priceLabelLeft && <div className={styles.labelLeft}>{priceLabelLeft}</div>}
              {priceValue && <div className={styles.valueRight}>{priceValue}</div>}
            </>
          )}
        </div>
        {actions && (
          <div className={clsx(styles.actions, actionsClassName)}>
            {actions}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PrizeModal;


