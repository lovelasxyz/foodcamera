import React, { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { imageCache } from '@/services/ImageCache';
import { ASSETS } from '@/constants/assets';
import { useSpinLogic } from './hooks/useSpinLogic';
import RouletteView from './RouletteView';
import { RouletteItem } from '@/types/game';

export const RouletteContainer: React.FC = () => {
  const { t } = useI18n();
  const { currentCase, isSpinning, spinResult, showResult } = useGameStore();
  const { showWinModal, setShowWinModal, /* setActivePage, */ openModal } = useUIStore();
  const navigate = useNavigate();
  const [state, api] = useSpinLogic();

  const rouletteItems: RouletteItem[] = useMemo(() => {
    if (!currentCase) return [];
    const items: RouletteItem[] = [];
    const totalItemsInCase = currentCase.items.length;
    const neededElements = 5 * totalItemsInCase * 2;
    const reelLength = Math.max(neededElements, 300);
    for (let i = 0; i < reelLength; i++) {
      const originalIndex = i % totalItemsInCase;
      const item = currentCase.items[originalIndex];
      items.push({ ...item, uniqueId: `roulette-${i}`, originalIndex });
    }
    return items;
  }, [currentCase]);

  React.useEffect(() => {
    if (!currentCase) return;
    
    // Предзагружаем только уникальные изображения
    const uniqueImages = [...new Set(currentCase.items.map(item => item.image))];
    const criticalImages = [ASSETS.IMAGES.TON, ASSETS.IMAGES.UNION];
    
    imageCache.preload([...criticalImages, ...uniqueImages], { 
      concurrency: 2, // Уменьшите concurrency для стабильности
    });
  }, [currentCase]);

  const handleSpin = () => api.handleSpin(rouletteItems.length);
  const handleDepositRedirect = () => {
    navigate(ROUTES.profile);
    openModal('deposit');
  };
  const handleClose = () => api.handleCloseCase();

  const sortedPrizes = useMemo(() => {
    if (!currentCase) return [];
    return [...currentCase.items].sort((a, b) => b.price - a.price);
  }, [currentCase]);

  if (!currentCase) return null;

  return (
    <RouletteView
      currentCase={currentCase}
      isSpinning={isSpinning}
      showResult={showResult}
      spinResult={spinResult}
      rouletteItems={rouletteItems}
      state={state}
      api={api}
      onSpin={handleSpin}
      onDeposit={handleDepositRedirect}
      onClose={handleClose}
      tonIcon={ASSETS.IMAGES.TON}
      unionIcon={ASSETS.IMAGES.UNION}
      sortedPrizes={sortedPrizes}
      t={t}
      showWinModal={showWinModal}
      setShowWinModal={setShowWinModal}
    />
  );
};

export default RouletteContainer;
