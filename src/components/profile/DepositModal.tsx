import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUserStore } from '@/store/userStore';
import { useDepositStore } from '@/store/depositStore';
import styles from './DepositModal.module.css';
import { SuccessModal } from '@/components/ui/SuccessModal/SuccessModal';
import { ErrorBanner } from '@/components/ui/ErrorBanner/ErrorBanner';
import { useI18n } from '@/i18n';
import { DomainEventBus } from '@/domain/events/EventBus';
import { DomainEventNames } from '@/domain/events/DomainEvents';
import { isApiEnabled } from '@/config/api.config';

// Simplified: only USDT via internal balance top-up
type DepositMethod = 'usdt';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  useUserStore(); // retain for potential user data (no direct balance mutation here)
  const { createDeposit, isLoading } = useDepositStore();
  useState<DepositMethod>('usdt');
  const [amount, setAmount] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [keyboardActive, setKeyboardActive] = useState<boolean>(false);

  // Reset form when modal opens to avoid autofill/cached state
  useEffect(() => {
    if (isOpen) { setAmount(''); setPromoCode(''); }
  }, [isOpen]);

  // Hide error when user clears or edits promo
  useEffect(() => {
    if (!promoCode) {
      setPromoError(null);
    }
  }, [promoCode]);

  // Keep a short address helper for potential future UI needs
  // shortAddress removed (no on-chain transfer in simplified USDT flow)

  const getBonusMultiplier = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'CLAP') return 0.3; // +30%
    return 0;
  };

  const isPromoValid = (codeStr: string) => {
    const code = (codeStr || '').trim().toUpperCase();
    return code === 'PROMO' || code === 'CLAP';
  };

  const performDeposit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const code = promoCode.trim().toUpperCase();
    // Demo validation: only PROMO and CLAP are accepted, otherwise show error
    if (code && !isPromoValid(code)) {
      setPromoError('Promocode not found or limit exceeded');
      return;
    }
    setPromoError(null);
    const flatBonus = code === 'PROMO' ? 1 : 0;
    const percentBonus = getBonusMultiplier();
    const total = numericAmount + flatBonus + numericAmount * percentBonus;
    if (isApiEnabled()) {
      await createDeposit(total);
    } else {
      await createDeposit(total); // mock path auto-confirms & credits
    }
    DomainEventBus.emit(DomainEventNames.DepositMade, { type: 'DepositMade', amount: total, method: 'usdt', timestamp: Date.now() });
    setShowSuccess(true);
    onClose();
  };
  const handleSubmit = () => { void performDeposit(); };

  const renderUsdt = () => (
    <div className={styles.section}>
      <div className={styles.promoSection}>
        <div className={styles.promoCard}>
          <img className={styles.promoImage} src="/assets/images/discount_promo-min.png" alt="Promocode" />
          <div className={styles.promoTitle}>{t('deposit.promoTitle')}</div>
          <div className={styles.promoSubtitle}>{t('deposit.promoSubtitle')}</div>
          <svg className={styles.promoDots} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 337 3" fill="none">
            <path d="M0 1.5H337" stroke="white" strokeWidth="2" strokeDasharray="8 4" opacity="0.5" />
          </svg>
        </div>
        <div className={styles.promoInputContainer}>
          <div className={styles.promoInputWrapper}>
          
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(null); }}
              placeholder={t('deposit.promoPlaceholder')}
              className={styles.promoInput}
              onFocus={() => setKeyboardActive(true)}
              onBlur={() => { setKeyboardActive(false); const c = promoCode.trim(); if (c && !isPromoValid(c)) setPromoError(t('deposit.promoInvalid')); }}
            />
              {promoCode.trim().toUpperCase() === 'CLAP' && (
              <div className={styles.bonusBadge}>+30%</div>
            )}
          </div>
        </div>
      </div>
      {promoError && (
        <ErrorBanner message={promoError} />
      )}
      <div className={styles.amountGroup}>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const raw = e.target.value.replace(",", ".");
            // allow only digits and one dot
            const cleaned = raw
              .replace(/[^0-9.]/g, '')
              .replace(/(\..*)\./g, '$1');
            // prevent leading zeros like 00, keep 0.x
            const normalized = cleaned.startsWith('00') ? cleaned.replace(/^0+/, '0') : cleaned;
            setAmount(normalized);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { handleSubmit(); }
            // block minus, plus, exponent markers
            if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e') {
              e.preventDefault();
            }
          }}
          onFocus={() => setKeyboardActive(true)}
          onBlur={() => {
            setKeyboardActive(false);
            // trim trailing dot and normalize to positive number
            if (amount) {
              let v = amount.replace(/\.$/, '');
              const n = Number(v);
              if (!Number.isFinite(n) || n <= 0) {
                setAmount('');
              } else {
                setAmount(String(n));
              }
            }
          }}
          placeholder={t('deposit.amountPlaceholder')}
          className={styles.amountInput}
          aria-label={t('deposit.amountAria')}
        />
        <div className={styles.coin}>USDT</div>
      </div>
      {/* To receive row: show only when valid promo is applied */}
      {isPromoValid(promoCode) && (
        <div className={styles.receiveRow}>
          <span>{t('deposit.toReceive')}</span>
          <span className={styles.receiveValue}>
            {(() => {
              const numericAmount = Number(amount) || 0;
              const flatBonus = promoCode.trim().toUpperCase() === 'PROMO' ? 1 : 0;
              const pct = getBonusMultiplier();
              const total = numericAmount + flatBonus + numericAmount * pct;
              return total.toFixed(2);
            })()} 
            
          </span>
          <span style={{ fontSize: 12, marginLeft: 4 }}>USDT</span>
        </div>
      )}
      {/* QR / address removed for simplified USDT flow (handled externally) */}
      <button
        className={`${styles.depositButton} ${!amount ? styles.depositButtonDisabled : ''}`}
        onClick={handleSubmit}
        disabled={!amount || isLoading}
      >
        <div className={styles.buttonLabel}>{isLoading ? t('common.loading') : `${t('deposit.buttonDeposit')} USDT`}</div>
      </button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => { onClose(); }}
        title={t('deposit.modalTitleUSDT')}
        subtitle={t('deposit.modalSubtitleUSDT')}
        size="md"
        variant="bottomSheet"
        bottomSheetAnimated
        keyboardActive={keyboardActive}
        className={styles.depositModal}
        overlayClassName={styles.depositOverlay}
      >
        {renderUsdt()}
      </Modal>
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={t('deposit.successTitle')}
        subtitle={t('deposit.successSubtitle')}
        autoCloseMs={2000}
      />
    </>
  );
};



