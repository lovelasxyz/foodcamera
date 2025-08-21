import React from 'react';
import { useCasesStore } from '@/store/casesStore';
import { Header } from '@/components/layout/Header';
import { LiveStatusBar } from '@/components/layout/LiveStatusBar';
import { CaseCard } from '@/components/game/CaseCard';
import { RouletteWheel } from '@/components/game/RouletteWheel';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ASSETS } from '@/constants/assets';
import { MESSAGES } from '@/utils/constants';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const { cases, isLoading } = useCasesStore();

  if (isLoading) {
    return (
      <div className={styles.homePage}>
        <Header />
        <div className={styles.loading}>
          <Loader text={MESSAGES.LOADING_CASES} size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.homePage}>
      <Header />
      
      <div className={styles.casesContainer}>
        {/* Live status bar */}
        <LiveStatusBar />

        {/* Free case banner */}
        <div className={styles.freeCaseBanner}>
          <div className={styles.bannerContent}>
            <div className={styles.lightningIcon}>
              <img src={ASSETS.IMAGES.LIGHTNING} alt="Lightning" />
            </div>
            <div className={styles.bannerText}>{MESSAGES.CHECK_NEWS}</div>
          </div>
          <Button size="sm" className={styles.telegramButton}>
            {MESSAGES.OPEN_CASE}
          </Button>
        </div>
        
        {/* Сетка кейсов */}
        <div className={styles.casesGrid}>
          {cases.length > 0 ? (
            cases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseData={caseItem} />
            ))
          ) : (
            <div className={styles.noCases}>
              <Loader text={MESSAGES.LOADING_CASES} size="md" />
            </div>
          )}
        </div>
      </div>
      
      {/* Компонент рулетки */}
      <RouletteWheel />
    </div>
  );
}; 