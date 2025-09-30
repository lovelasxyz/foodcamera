import React from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './RouletteWheel.module.css';
import { SpinControls, PrizeDisplay, PossiblePrizes } from './components';
import { RouletteViewport } from './RouletteViewport';
import { PrizeModal } from '@/components/game/PrizeCard';
import { SpinLogicState, SpinLogicApi } from './hooks/useSpinLogic';
import { Case, Prize, SpinResult, RouletteItem } from '@/types/game';
import { usePrizeDescription } from '@/i18n/prizeDescriptions';

interface RouletteViewProps {
  currentCase: Case | null;
  isSpinning: boolean;
  showResult: boolean;
  spinResult: SpinResult | null;
  rouletteItems: RouletteItem[];
  state: SpinLogicState;
  api: SpinLogicApi;
  onSpin: () => void;
  onDeposit: () => void;
  onClose: () => void;
  tonIcon: string;
  unionIcon: string;
  sortedPrizes: Prize[];
  t: (k: string) => string;
  showWinModal: boolean;
  setShowWinModal: (v: boolean) => void;
}

const RouletteView: React.FC<RouletteViewProps> = ({
  currentCase,
  isSpinning,
  showResult,
  spinResult,
  rouletteItems,
  state,
  api,
  onSpin,
  onDeposit,
  onClose,
  tonIcon,
  unionIcon,
  sortedPrizes,
  t,
  showWinModal,
  setShowWinModal
}) => {
  const { position, instantPosition, targetReplicaIndex, previewPrize, hasEnoughFunds } = state;
  const getDescription = usePrizeDescription();

  return (
    <>
      <Modal isOpen={!!currentCase} onClose={onClose} title={currentCase?.name || ''} size="lg">
        {!showResult ? (
          <div className={styles.rouletteContainer}>
            <RouletteViewport
              items={rouletteItems}
              isSpinning={isSpinning}
              instantPosition={instantPosition}
              position={position}
              targetReplicaIndex={targetReplicaIndex}
              onTransitionEnd={api.handleAnimationEnd}
              tonIcon={tonIcon}
              unionIcon={unionIcon}
            />
            <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', marginLeft: '14px', color: 'grey', fontSize: '14px' }}>
              <input type="checkbox" id="show-win-modal" checked={showWinModal} onChange={(e) => setShowWinModal(e.target.checked)} style={{ marginRight: '8px' }} />
              <label htmlFor="show-win-modal">{t('roulette.showWin')}</label>
            </div>
            <SpinControls
              isSpinning={isSpinning}
              hasEnoughFunds={hasEnoughFunds}
              price={currentCase?.price ?? 0}
              onSpin={onSpin}
              onSkip={api.handleSkipSpin}
              onDeposit={onDeposit}
              labelSpin={isSpinning ? t('roulette.spinning') : t('roulette.spin')}
              labelDeposit={t('roulette.deposit')}
            />

            <PossiblePrizes title={t('roulette.possiblePrizes')} prizes={sortedPrizes} onPreview={(item) => api.setPreviewPrize(item)} />
          </div>
        ) : (
          <>
            <PrizeDisplay
              name={spinResult?.prize.name}
              price={spinResult?.prize.price}
              image={spinResult?.prize.image}
              keepLabel={t('roulette.keepIt')}
              sellLabel={t('roulette.quickSell')}
              isSpinning={isSpinning}
              onKeep={api.handleKeepPrize}
              onSell={api.handleQuickSell}
              showSell={(() => {
                const p = spinResult?.prize;
                if (!p) return false;
                if (p.isShard) return false;
                if (p.benefit) return false; // hide for any benefit (discount, subscription, lottery, bigwin)
                if (p.nonRemovableGift) return false;
                return true;
              })()}
            />
            <PossiblePrizes title={t('roulette.possiblePrizes')} prizes={sortedPrizes} onPreview={(item) => api.setPreviewPrize(item)} />
          </>
        )}
      </Modal>

      <PrizeModal
        key="preview"
        isOpen={!!previewPrize}
        onClose={() => api.setPreviewPrize(null)}
        title={previewPrize?.name}
        image={previewPrize?.image || ''}
        description={getDescription(previewPrize)}
        rarityLabelLeft={t('roulette.rarity')}
        rarityValue={(() => {
          const r = previewPrize?.rarity;
          if (!r) return undefined;
          return t(`roulette.rarityNames.${r}`);
        })()}
        priceLabelLeft={t('roulette.price')}
        priceValue={previewPrize ? previewPrize.price.toFixed(2) : undefined}
      />
    </>
  );
};

export default RouletteView;
