import React from 'react';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { shouldUseGuestMode } from '@/utils/environment';
import styles from './Header.module.css';
import { ASSETS } from '@/constants/assets';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';

export const Header: React.FC = () => {
  const { user } = useUserStore();
  const { /* setActivePage, */ openModal } = useUIStore();
  const navigate = useNavigate();
  const isGuestMode = shouldUseGuestMode();
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  const handleProfileClick = () => {
    navigate(ROUTES.profile);
  };

  const handleDepositClick = () => {
    navigate(ROUTES.profile);
    openModal('deposit');
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
              target.src = ASSETS.IMAGES.AVATAR;
            }}
          />
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>
              {user.name}
              {isGuestMode && <span className={styles.guestBadge}> (Guest)</span>}
            </div>
          </div>
        </div>
        
        {isOnline ? (
          <div className={styles.walletSection}>
            <div className={styles.walletDropdownContainer}>
              <button className={styles.walletAddressButton} onClick={handleDepositClick}>
                <span>{t('common.deposit')}</span>
              </button>
            </div>
            <div className={styles.coinCountContainer} onClick={handleProfileClick}>
              <div className={styles.coinCount}>{user.balance.toFixed(2)}</div>
              <div className={styles.coinContainer}>
                <div className={styles.coin}>
                  <img 
                    className={styles.coinIcon} 
                    src={ASSETS.IMAGES.TON} 
                    alt="TON"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.offlineBadge} title="Offline">
            <svg className={styles.wifiIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8.82C4.9 6.35 8.34 5 12 5c3.66 0 7.1 1.35 10 3.82" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
              <path d="M5 12.02C7.01 10.35 9.43 9.5 12 9.5c2.57 0 4.99.85 7 2.52" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 15.22c1.1-.9 2.48-1.4 4-1.4 1.52 0 2.9.5 4 1.4" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="19" r="1.75" fill="#666"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </header>
  );
}; 