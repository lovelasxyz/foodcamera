import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { shouldUseGuestMode } from '@/utils/environment';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { user } = useUserStore();
  const { setActivePage } = useUIStore();
  const isGuestMode = shouldUseGuestMode();

  const handleProfileClick = () => {
    setActivePage('profile');
  };

  return (
    <header className={styles.userHeader}>
      <div className={styles.userHeaderRow}>
        <div className={styles.profile} onClick={handleProfileClick}>
          <img 
            src={user.avatar} 
            alt="User Avatar" 
            className={styles.avatar}
            onError={(e) => {
              // Fallback к дефолтной аватарке при ошибке загрузки
              const target = e.target as HTMLImageElement;
              target.src = '/assets/images/avatar.png';
            }}
          />
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>
              {user.name}
              {isGuestMode && <span className={styles.guestBadge}> (Guest)</span>}
            </div>
          </div>
        </div>
        
        <div className={styles.walletSection}>
          <div className={styles.walletDropdownContainer}>
            <button className={styles.walletAddressButton}>
              <span>{user.wallet || 'UQDKd...hxwP'}</span>
              <ChevronDown size={10} />
            </button>
          </div>
          <div className={styles.coinCountContainer} onClick={handleProfileClick}>
            <div className={styles.coinCount}>{user.balance.toFixed(2)}</div>
            <div className={styles.coinContainer}>
              <div className={styles.coin}>
                <img 
                  className={styles.coinIcon} 
                  src="/assets/images/ton.svg" 
                  alt="TON"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}; 