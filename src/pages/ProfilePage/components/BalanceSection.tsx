import React from 'react';
import styles from '../ProfilePage.module.css';
import { ASSETS } from '@/constants/assets';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n';

interface BalanceSectionProps {
  balance: number;
  onDeposit: () => void;
}

export const BalanceSection: React.FC<BalanceSectionProps> = ({ balance, onDeposit }) => {
  const { t } = useI18n();
  return (
    <div className={styles.balanceContainer}>
      <div className={styles.balanceInfo}>
        <div className={styles.balanceLabel}>{t('common.balance')}</div>
        <div className={styles.balanceValue}>
          {balance.toFixed(2)}
          <img src={ASSETS.IMAGES.TON} alt="TON" style={{ width: '20px', height: '20px' }} />
        </div>
      </div>
      <Button className={styles.depositButton} onClick={onDeposit}>
        {t('common.deposit')}
      </Button>
    </div>
  );
};




