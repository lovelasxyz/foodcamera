import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { ASSETS } from '@/constants/assets';
import styles from './BottomNavigation.module.css';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { useI18n } from '@/i18n';

interface NavigationTab {
  id: string;
  label: string;
  icon: 'main' | 'upgrade' | 'profile';
}

const navigationTabs: NavigationTab[] = [
  { id: 'main', label: 'Main', icon: 'main' },
  { id: 'upgrade', label: 'Portal', icon: 'upgrade' },
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
    case 'upgrade':
      return <img src={ASSETS.IMAGES.UPGRADE} alt="Upgrade" className={styles.iconImage} />;
    case 'profile':
      return <img src={ASSETS.IMAGES.PROFILE} alt="Profile" className={styles.iconImage} />;
    default:
      return null;
  }
};

export const BottomNavigation: React.FC = () => {
  useUIStore();
  const location = useLocation();
  const { t } = useI18n();

  const handleExternal = (tab: NavigationTab) => {
    ConnectivityGuard.ensureOnline();
    if (tab.id === 'upgrade') {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink('https://www.speedtest.net/');
      } else {
        window.open('https://www.speedtest.net/', '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <nav className={styles.footerMenu}>
      {navigationTabs.map((tab) => {
        const to = tab.id === 'main' ? ROUTES.home : tab.id === 'profile' ? ROUTES.profile : `/${tab.id}`;
        const isActive = location.pathname === to;
        if (tab.id === 'upgrade') {
          return (
            <div
              key={tab.id}
              className={`${styles.footerTab} ${isActive ? styles.footerTabActive : ''}`}
              onClick={() => handleExternal(tab)}
            >
              <div className={styles.footerIcon}>{renderIcon(tab.icon)}</div>
              <div className={styles.footerLabel}>{t('nav.jackpot')}</div>
            </div>
          );
        }
        return (
          <Link key={tab.id} to={to} className={`${styles.footerTab} ${isActive ? styles.footerTabActive : ''}`}>
            <div className={styles.footerIcon}>{renderIcon(tab.icon)}</div>
            <div className={styles.footerLabel}>
              {tab.id === 'main' && t('nav.main')}
              {tab.id === 'jackpot' && t('nav.jackpot')}
              {tab.id === 'upgrade' && t('nav.upgrade')}
              {tab.id === 'profile' && t('nav.profile')}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}; 