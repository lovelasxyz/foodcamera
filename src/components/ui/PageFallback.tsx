import React from 'react';
// Skeleton not used directly in profile fallback now
import { Header } from '@/components/layout/Header';
import { LiveStatusBar } from '@/components/layout/LiveStatusBar';
import { Button } from '@/components/ui/Button';
import { ASSETS } from '@/constants/assets';
import { useI18n } from '@/i18n';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import homeStyles from '@/pages/HomePage/HomePage.module.css';
import profileStyles from '@/pages/ProfilePage/ProfilePage.module.css';
import { CaseCardSkeleton } from '@/components/game/CaseCard/CaseCardSkeleton';
import { Skeleton } from './Skeleton/Skeleton';

export const PageFallback: React.FC = () => {
  const { t } = useI18n();
  const { activePage } = useUIStore();
  const { user } = useUserStore();

  if (activePage === 'profile') {
    return (
      <div className={profileStyles.profileContainer}>
        <div className={profileStyles.profilePage}>
          {/* User Profile Section (always visible) */}
          <div className={profileStyles.userProfile}>
            <div className={profileStyles.profileInfo}>
              <div className={profileStyles.avatars}>
                <img src={ASSETS.IMAGES.AVATAR} alt="User avatar" className={profileStyles.profileAvatar} />
              </div>
              <div className={profileStyles.profileDetails}>
                <div className={profileStyles.profileName}>{user?.name || 'Unknown'}</div>
                <div className={profileStyles.profileId}>#{user?.id || 'guest'}</div>
              </div>
            </div>
          </div>

          {/* Balance Section (visible) */}
          <div className={profileStyles.balanceContainer}>
            <div className={profileStyles.balanceInfo}>
              <div className={profileStyles.balanceLabel}>{t('common.balance')}</div>
              <div className={profileStyles.balanceValue}>
                0.00
                <img src={ASSETS.IMAGES.TON} alt="TON" style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <Button className={profileStyles.depositButton}>{t('common.deposit')}</Button>
          </div>

          {/* Wallet Section (visible) */}
          <div className={profileStyles.walletContainer}>
            <div className={profileStyles.walletInfo}>
              <div className={profileStyles.walletLabel}>{t('common.connectedWallet')}</div>
              <div className={profileStyles.walletAddress}>UQDKd...hxwP</div>
            </div>
            <Button className={profileStyles.disconnectButton}>{t('common.disconnect')}</Button>
          </div>

          {/* Invite Friends Section (visible) */}
          <div className={profileStyles.inviteContainer}>
            <img
              src={ASSETS.IMAGES.LIGHTNING_PNG}
              alt="Decorative lightning"
              className={profileStyles.inviteLightning}
            />
            <div className={profileStyles.inviteContent}>
              <img src={ASSETS.ICONS.INVITE} style={{ width: '35px', height: '35px' }} />
              <div className={profileStyles.inviteText}>{t('common.inviteTitle')}</div>
            </div>
            <Button className={profileStyles.inviteButton}>{t('common.inviteCta')}</Button>
          </div>

          {/* Inventory header visible; grid skeletons only for first lazy load */}
          <div className={profileStyles.inventoryContainer}>
            <div className={profileStyles.inventoryHeader}>
              <div className={profileStyles.inventoryLabel}>{t('common.inventory')}</div>
              <Button className={profileStyles.inventoryButton}>{t('common.showAll')}</Button>
            </div>
            <div className={profileStyles.inventoryGrid}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton key={`pf-inv-skel-${idx}`} width="100%" height={195} borderRadius={16} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: main page
  return (
    <div className={homeStyles.homePage}>
      <Header />
      <div className={homeStyles.casesContainer}>
        {/* Live status bar visible */}
        <LiveStatusBar />

        {/* Free case banner visible */}
        <div className={homeStyles.freeCaseSlider}>
          <div className={homeStyles.freeCaseSlide}>
            <div className={homeStyles.bannerContent}>
              <div className={homeStyles.lightningIcon}>
                <img src={ASSETS.IMAGES.LIGHTNING} alt="Lightning" />
              </div>
              <div className={homeStyles.bannerText}>{t('Free case')}</div>
            </div>
            <Button size="sm" className={homeStyles.telegramButton}>
              {t('messages.openCase')}
            </Button>
          </div>
        </div>

        {/* Тут баг Content grid skeletons only */}
        <div className={homeStyles.casesGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <CaseCardSkeleton key={`pf-case-skel-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
};


