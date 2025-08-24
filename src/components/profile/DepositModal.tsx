import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import styles from './DepositModal.module.css';
import { ASSETS } from '@/constants/assets';
import { SuccessModal } from '@/components/ui/SuccessModal/SuccessModal';
import { ErrorBanner } from '@/components/ui/ErrorBanner/ErrorBanner';

type DepositMethod = 'select' | 'ton' | 'cryptobot' | 'gifts';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { user, updateBalance } = useUserStore();
  const [method, setMethod] = useState<DepositMethod>('select');
  const [amount, setAmount] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [keyboardActive, setKeyboardActive] = useState<boolean>(false);

  // Reset form when modal opens to avoid autofill/cached state
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPromoCode('');
      setMethod('select');
    }
  }, [isOpen]);

  // Hide error when user clears or edits promo
  useEffect(() => {
    if (!promoCode) {
      setPromoError(null);
    }
  }, [promoCode]);

  // Keep a short address helper for potential future UI needs
  const shortAddress = useMemo(() => {
    const addr = user.wallet || 'UQDKd...hxwP';
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [user.wallet]);

  const getBonusMultiplier = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'CLAP') return 0.3; // +30%
    return 0;
  };

  const isPromoValid = (codeStr: string) => {
    const code = (codeStr || '').trim().toUpperCase();
    return code === 'PROMO' || code === 'CLAP';
  };

  const performDeposit = () => {
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
    updateBalance(total);
    setShowSuccess(true);
    onClose();
  };

  const openTonTransfer = () => {
    const addr = user.wallet || 'UQDKd...hxwP';
    const value = amount && Number(amount) > 0 ? `?amount=${amount}` : '';
    const url = `ton://transfer/${addr}${value}`;
    window.location.href = url;
  };

  const handleSubmit = () => {
    performDeposit();
    openTonTransfer();
  };

  const renderSelection = () => (
    <div className={styles.section}>
      <div className={styles.subtitle}>Select the method of deposit</div>
      <div className={styles.methodsGrid}>
        <button className={`${styles.methodCard} ${styles.ton}`} onClick={() => setMethod('ton')}>
          <img src={ASSETS.IMAGES.TON} alt="Ton" className={styles.methodIcon} />
          <div className={styles.methodTitle}>Ton</div>
        </button>
        <button className={`${styles.methodCard} ${styles.cryptobot}`} onClick={() => setMethod('cryptobot')}>
          <img src={ASSETS.IMAGES.TOKEN} alt="CryptoBot" className={styles.methodIcon} />
          <div className={styles.methodTitle}>CryptoBot</div>
        </button>
        <button className={`${styles.methodCard} ${styles.gifts} ${styles.fullWidth}`} onClick={() => setMethod('gifts')}>
          <img src={ASSETS.IMAGES.GIFT} alt="Gifts" className={styles.methodIcon} />
          <div className={styles.methodTitle}>Gifts</div>
        </button>
      </div>
    </div>
  );

  const renderTon = () => (
    <div className={styles.section}>
      <div className={styles.promoSection}>
        <div className={styles.promoCard}>
          <img className={styles.promoImage} src="/assets/images/discount_promo-min.png" alt="Promocode" />
          <div className={styles.promoTitle}>Get a bonus on your deposit</div>
          <div className={styles.promoSubtitle}>Look for promo codes in <span className="text-semibold">@case</span><br />or in the channels of our partners.</div>
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
              placeholder="Promocode"
              className={styles.promoInput}
              onFocus={() => setKeyboardActive(true)}
              onBlur={() => { setKeyboardActive(false); const c = promoCode.trim(); if (c && !isPromoValid(c)) setPromoError('Promocode not found or limit exceeded'); }}
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
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { handleSubmit(); } }}
          onFocus={() => setKeyboardActive(true)}
          onBlur={() => setKeyboardActive(false)}
          placeholder="Enter amount"
          className={styles.amountInput}
        />
        <div className={styles.coin}>
          <img src={ASSETS.IMAGES.TON} alt="Coin" style={{ width: 20, height: 20 }} />
        </div>
      </div>
      {/* To receive row: show only when valid promo is applied */}
      {isPromoValid(promoCode) && (
        <div className={styles.receiveRow}>
          <span>To receive:</span>
          <span className={styles.receiveValue}>
            {(() => {
              const numericAmount = Number(amount) || 0;
              const flatBonus = promoCode.trim().toUpperCase() === 'PROMO' ? 1 : 0;
              const pct = getBonusMultiplier();
              const total = numericAmount + flatBonus + numericAmount * pct;
              return total.toFixed(2);
            })()} 
            
          </span>
          <img src={ASSETS.IMAGES.TON} alt="ton" style={{ width: 16, height: 16 }} />
        </div>
      )}
      <div className={styles.qr}>
        <img
          className={styles.qrImage}
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(user.wallet || 'UQDKd...hxwP')}`}
          alt="Wallet QR"
        />
      </div>
      <div className={styles.addressRow}>
        <div className={styles.addressText}>{shortAddress}</div>
        <Button onClick={() => navigator.clipboard.writeText(user.wallet || 'UQDKd...hxwP')}>Copy</Button>
      </div>
      <button
        className={`${styles.depositButton} ${!amount ? styles.depositButtonDisabled : ''}`}
        onClick={handleSubmit}
        disabled={!amount}
      >
        <div className={styles.buttonLabel}>Deposit</div>
      </button>
    </div>
  );

  const renderCryptoBot = () => (
    <div className={styles.section}>
      <div className={styles.subtitle}>You will be redirected to CryptoBot in Telegram.</div>
      <Button onClick={() => window.open('https://t.me/CryptoBot', '_blank')}>Open CryptoBot</Button>
      <Button variant="secondary" onClick={() => setMethod('select')}>Back</Button>
    </div>
  );

  const renderGifts = () => (
    <div className={styles.section}>
      <div className={styles.subtitle}>Use Gift cards to top up your balance.</div>
      <Button disabled>Coming soon</Button>
      <Button variant="secondary" onClick={() => setMethod('select')}>Back</Button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => { setMethod('select'); onClose(); }}
        title={method === 'ton' ? 'TON Deposit' : 'Deposit'}
        subtitle={method === 'ton' ? 'Enter the amount to deposit' : undefined}
        size="md"
        onBack={method !== 'select' ? () => setMethod('select') : undefined}
        variant="bottomSheet"
        bottomSheetAnimated
        keyboardActive={keyboardActive}
      >
        {method === 'select' && renderSelection()}
        {method === 'ton' && renderTon()}
        {method === 'cryptobot' && renderCryptoBot()}
        {method === 'gifts' && renderGifts()}
      </Modal>
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Payment received"
        subtitle="Your balance has been updated"
        autoCloseMs={2000}
      />
    </>
  );
};



