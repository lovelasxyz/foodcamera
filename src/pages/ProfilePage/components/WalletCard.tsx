import React from 'react';
import styles from '../ProfilePage.module.css';

interface WalletCardProps {
  address?: string;
  onDisconnect: () => void;
  label: string;
  disconnectText: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({ address, onDisconnect, label, disconnectText }) => {
  return (
    <div className={styles.walletContainer}>
      <div className={styles.walletInfo}>
        <div className={styles.walletLabel}>{label}</div>
        <div className={styles.walletAddress}>
          {address ? address : 'UQDKd...hxwP'}
        </div>
      </div>
      <button 
        className={styles.disconnectButton}
        onClick={onDisconnect}
      >
        {disconnectText}
      </button>
    </div>
  );
};



