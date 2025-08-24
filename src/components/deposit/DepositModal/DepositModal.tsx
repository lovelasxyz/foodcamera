import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { ASSETS } from '@/constants/assets';
import styles from './DepositModal.module.css';

type DepositStep = 'amount' | 'method' | 'pay' | 'success';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export const DepositModal: React.FC = () => {
  const { isModalOpen, modalType, closeModal } = useUIStore();
  const { updateBalance } = useUserStore();

  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'tonkeeper' | 'wallet' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = isModalOpen && modalType === 'deposit';

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setStep('amount');
      setAmount(25);
      setCustomAmount('');
      setSelectedMethod(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const parsedAmount = useMemo(() => {
    const val = Number(customAmount);
    if (!customAmount) return amount;
    if (Number.isNaN(val) || val <= 0) return amount;
    return Math.min(1000000, Math.round(val * 100) / 100);
  }, [customAmount, amount]);

  const selectedValue = parsedAmount;

  const tonDeepLink = useMemo(() => {
    // Demo TON deep link. Replace with real merchant address if needed.
    const address = 'EQC_DEMO_DEPOSIT_ADDRESS_1234567890';
    const nanoAmount = Math.round(selectedValue * 1e9); // TON has 9 decimals
    return `ton://transfer/${address}?amount=${nanoAmount}&text=Case%20Bot%20Deposit`;
  }, [selectedValue]);

  const onClose = () => {
    if (isSubmitting) return;
    closeModal();
  };

  const handleContinueFromAmount = () => {
    setStep('method');
  };

  const handleContinueFromMethod = () => {
    if (!selectedMethod) return;
    setStep('pay');
  };

  const handleMarkAsPaid = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    updateBalance(selectedValue);
    setIsSubmitting(false);
    setStep('success');
  };

  const handleSuccessDone = () => {
    closeModal();
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit" size="md">
      <div className={styles.container}>
        <div className={styles.stepper}>
          <div className={styles.step + ' ' + (step === 'amount' ? styles.active : '')}>1</div>
          <div className={styles.line} />
          <div className={styles.step + ' ' + (step === 'method' ? styles.active : '')}>2</div>
          <div className={styles.line} />
          <div className={styles.step + ' ' + (step === 'pay' ? styles.active : '')}>3</div>
        </div>

        <div className={styles.viewport}>
          <AnimatePresence mode="wait">
            {step === 'amount' && (
              <motion.div
                key="amount"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={styles.stepContent}
              >
                <div className={styles.sectionTitle}>Choose amount</div>
                <div className={styles.amountGrid}>
                  {PRESET_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      className={styles.amountChip + ' ' + (selectedValue === v ? styles.chipActive : '')}
                      onClick={() => {
                        setAmount(v);
                        setCustomAmount('');
                      }}
                    >
                      <img src={ASSETS.IMAGES.TON} alt="TON" className={styles.tokenIcon} />
                      <span>{v}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputLabel}>Custom amount</div>
                  <div className={styles.inputBox}>
                    <img src={ASSETS.IMAGES.TON} alt="TON" className={styles.inputToken} />
                    <input
                      className={styles.input}
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className={styles.footerRow}>
                  <div className={styles.previewValue}>
                    <img src={ASSETS.IMAGES.TON} alt="TON" />
                    <span>{selectedValue.toFixed(2)}</span>
                  </div>
                  <Button className={styles.primaryBtn} onClick={handleContinueFromAmount}>Continue</Button>
                </div>
              </motion.div>
            )}

            {step === 'method' && (
              <motion.div
                key="method"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={styles.stepContent}
              >
                <div className={styles.sectionTitle}>Select payment method</div>
                <div className={styles.methods}>
                  <button
                    className={styles.methodCard + ' ' + (selectedMethod === 'tonkeeper' ? styles.methodActive : '')}
                    onClick={() => setSelectedMethod('tonkeeper')}
                  >
                    <img src={ASSETS.IMAGES.TON} alt="Tonkeeper" />
                    <div>
                      <div className={styles.methodName}>Tonkeeper</div>
                      <div className={styles.methodHint}>Open TON wallet app</div>
                    </div>
                  </button>
                  <button
                    className={styles.methodCard + ' ' + (selectedMethod === 'wallet' ? styles.methodActive : '')}
                    onClick={() => setSelectedMethod('wallet')}
                  >
                    <img src={ASSETS.IMAGES.TON} alt="Wallet" />
                    <div>
                      <div className={styles.methodName}>Any TON Wallet</div>
                      <div className={styles.methodHint}>Use transfer link</div>
                    </div>
                  </button>
                </div>

                <div className={styles.footerRow}>
                  <Button className={styles.secondaryBtn} onClick={() => setStep('amount')}>Back</Button>
                  <Button className={styles.primaryBtn} onClick={handleContinueFromMethod} disabled={!selectedMethod}>Continue</Button>
                </div>
              </motion.div>
            )}

            {step === 'pay' && (
              <motion.div
                key="pay"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={styles.stepContent}
              >
                <div className={styles.sectionTitle}>Complete the payment</div>
                <div className={styles.payBox}>
                  <div className={styles.payRow}>
                    <div className={styles.payLabel}>Amount</div>
                    <div className={styles.payValue}>
                      <img src={ASSETS.IMAGES.TON} alt="TON" />
                      <span>{selectedValue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className={styles.payRow}>
                    <div className={styles.payLabel}>Method</div>
                    <div className={styles.payValue}>{selectedMethod === 'tonkeeper' ? 'Tonkeeper' : 'TON Wallet'}</div>
                  </div>
                  <div className={styles.linkBox}>
                    <div className={styles.linkLabel}>Transfer link</div>
                    <div className={styles.linkValue}>{tonDeepLink}</div>
                    <div className={styles.linkActions}>
                      <Button
                        className={styles.secondaryBtn}
                        onClick={() => navigator.clipboard.writeText(tonDeepLink)}
                      >
                        Copy link
                      </Button>
                      <Button
                        className={styles.primaryBtn}
                        onClick={() => window.open(tonDeepLink, '_blank')}
                      >
                        Open wallet
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={styles.footerRow}>
                  <Button className={styles.secondaryBtn} onClick={() => setStep('method')}>Back</Button>
                  <Button className={styles.primaryBtn} onClick={handleMarkAsPaid} loading={isSubmitting}>I paid</Button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={styles.stepContent}
              >
                <div className={styles.successIcon}>✓</div>
                <div className={styles.successTitle}>Deposit successful</div>
                <div className={styles.successHint}>Your balance has been updated.</div>
                <Button className={styles.primaryBtn} onClick={handleSuccessDone}>Done</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
};

export default DepositModal;

