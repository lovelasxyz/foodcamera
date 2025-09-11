import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { ASSETS } from '@/constants/assets';
import styles from './BottomNavigation.module.css';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { useI18n } from '@/i18n';

interface NavigationTab {
  id: string;
  label: string;
  icon: 'main' | 'weekly' | 'jackpot' | 'upgrade' | 'profile';
}

const navigationTabs: NavigationTab[] = [
  { id: 'main', label: 'Main', icon: 'main' },
  { id: 'jackpot', label: 'JackPot', icon: 'jackpot' },
 // { id: 'upgrade', label: 'Upgrade', icon: 'upgrade' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

const renderIcon = (iconType: string) => {
  switch (iconType) {
    case 'main':
      return (
        <div className={styles.mainIcon}>
          <div className={styles.mainSquare}></div>
          <div className={styles.mainSquare}></div>
          <div className={styles.mainSquare}></div>
          <div className={styles.mainSquare}></div>
        </div>
      );
    case 'weekly':
      return <img src={ASSETS.IMAGES.LIGHTNING} alt="Weekly" className={styles.iconImage} />;
    case 'jackpot':
      return <img src={ASSETS.IMAGES.JACKPOT} alt="JackPot" className={styles.iconImage} />;
    case 'upgrade':
      return <img src={ASSETS.IMAGES.UPGRADE} alt="Upgrade" className={styles.iconImage} />;
    case 'profile':
      return <img src={ASSETS.IMAGES.PROFILE} alt="Profile" className={styles.iconImage} />;
    default:
      return null;
  }
};

export const BottomNavigation: React.FC = () => {
  const { activePage, setActivePage } = useUIStore();
  const { t } = useI18n();

  const handleTabClick = (tab: NavigationTab) => {
    // централизованная проверка соединения на клике между вкладками
    ConnectivityGuard.ensureOnline();
    // При клике всегда проверяем онлайн; если офлайн, просто меняем вкладку на доступные (но спины и т.п. уже заблокированы),
    // тут можно также показать уведомление при попытке перейти в Main.
    if (tab.id === 'jackpot') {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink('https://www.speedtest.net/');
      } else {
        // Fallback for when not in Telegram
        window.open('https://www.speedtest.net/', '_blank', 'noopener,noreferrer');
      }
    } else {
      setActivePage(tab.id as any);
    }
  };

  return (
    <nav className={styles.footerMenu}>
      {navigationTabs.map((tab) => (
        <div
          key={tab.id}
          className={`${styles.footerTab} ${activePage === tab.id ? styles.footerTabActive : ''}`}
          onClick={() => handleTabClick(tab)}
        >
          <div className={styles.footerIcon}>
            {renderIcon(tab.icon)}
          </div>
          <div className={styles.footerLabel}>
            {tab.id === 'main' && t('nav.main')}
            {tab.id === 'jackpot' && t('nav.jackpot')}
            {tab.id === 'upgrade' && t('nav.upgrade')}
            {tab.id === 'profile' && t('nav.profile')}
          </div>
        </div>
      ))}
    </nav>
  );
}; 