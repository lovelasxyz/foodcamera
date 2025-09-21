import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import useSoundEffects from '@/hooks/useSoundEffects';
import { ROULETTE_CONFIG, Prize } from '@/types/game';
import { RouletteEngine } from '@/domain/roulette/RouletteEngine';
import { SpinUseCase } from '@/application/roulette/SpinUseCase';
import { Money } from '@/domain/common/Money';
import { Analytics } from '@/services/analytics';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ConnectivityGuard } from '@/services/ConnectivityGuard';
import { DomainEventBus } from '@/domain/events/EventBus';
import { DomainEventNames } from '@/domain/events/DomainEvents';

export interface SpinLogicState {
  position: number;
  instantPosition: boolean;
  targetReplicaIndex: number | null;
  previewPrize: Prize | null;
  hasEnoughFunds: boolean;
}

export interface SpinLogicApi {
  setPreviewPrize: (prize: Prize | null) => void;
  handleSpin: (rouletteItemsLength: number) => void;
  handleAnimationEnd: () => void;
  handleKeepPrize: () => void;
  handleQuickSell: () => void;
  handleSkipSpin: () => void;
  resetRoulette: () => void;
  handleCloseCase: () => void;
}

export const useSpinLogic = (): [SpinLogicState, SpinLogicApi] => {
  const {
    currentCase,
    isSpinning,
    spinResult,
    showResult,
    startSpin,
    endSpin,
    resetForNextSpin,
    closeCase
  } = useGameStore();
  const { user, addToInventory, addInventoryItem, updateBalance } = useUserStore();
  const { showWinModal } = useUIStore();
  const { playSound } = useSoundEffects();
  const isOnline = useOnlineStatus();

  const [position, setPosition] = useState(0);
  const [instantPosition, setInstantPosition] = useState(false);
  const [targetReplicaIndex, setTargetReplicaIndex] = useState<number | null>(null);
  const [previewPrize, setPreviewPrize] = useState<Prize | null>(null);
  const clickLockRef = useRef(false);
  const awardedRef = useRef(false);
  const endGuardRef = useRef(false);
  const spinEndTimerRef = useRef<number | null>(null);

  const engine = useMemo(() => new RouletteEngine(ROULETTE_CONFIG), []);
  const spinUseCase = useMemo(() => new SpinUseCase(engine, { updateBalance, addToInventory }), [engine, updateBalance, addToInventory]);

  const resetRoulette = useCallback(() => {
    setPosition(0);
    setTargetReplicaIndex(null);
  }, []);

  const finalizeSpin = useCallback((settleDelay = 1000) => {
    if (endGuardRef.current) return;
    endGuardRef.current = true;
    // Small settle delay to allow last frame and highlight
    const t = window.setTimeout(() => {
      if (spinResult && currentCase) {
        if (showWinModal) {
          endSpin();
        } else {
          if (!awardedRef.current) {
            addToInventory(spinResult.prize, currentCase.name);
            awardedRef.current = true;
          }
          useGameStore.setState({ isSpinning: false });
        }
      } else {
        endSpin();
      }
      clickLockRef.current = false;
      if (spinEndTimerRef.current != null) {
        window.clearTimeout(spinEndTimerRef.current);
        spinEndTimerRef.current = null;
      }
    }, settleDelay);
    // store timer id only if not already set (best-effort)
    if (spinEndTimerRef.current == null) spinEndTimerRef.current = t as unknown as number;
  }, [spinResult, currentCase, showWinModal, endSpin, addToInventory]);

  const handleAnimationEnd = useCallback(() => {
    if (isSpinning) {
      finalizeSpin(1000);
    } else {
      clickLockRef.current = false;
    }
  }, [isSpinning, finalizeSpin]);

  const handleSpin = useCallback((rouletteItemsLength: number) => {
    ConnectivityGuard.ensureOnline();
    if (!currentCase || isSpinning || clickLockRef.current) return;
    if (!isOnline) return;
    if (!spinUseCase.canAfford(currentCase, user.balance)) return;


    clickLockRef.current = true;
    awardedRef.current = false;
    setTargetReplicaIndex(null);

    playSound('spin');
    Analytics.trackCaseOpened(currentCase.id);
    DomainEventBus.emit(DomainEventNames.CaseOpened, { type: 'CaseOpened', caseId: currentCase.id, timestamp: Date.now() });

    const result = spinUseCase.beginSpin(currentCase, user.balance, rouletteItemsLength);
    if (!result) { clickLockRef.current = false; return; }

    setInstantPosition(true);
    setPosition(0);
    requestAnimationFrame(() => {
      setInstantPosition(false);
      startSpin(result.prizeIndex);
      setPosition(result.position);
      setTargetReplicaIndex(result.targetDomIndex);
    });
    // Fallback: ensure we finish even if transitionend is dropped
    if (spinEndTimerRef.current != null) {
      window.clearTimeout(spinEndTimerRef.current);
      spinEndTimerRef.current = null;
    }
    endGuardRef.current = false;
    spinEndTimerRef.current = window.setTimeout(() => {
      // If still spinning after duration + buffer, finalize programmatically
      if (useGameStore.getState().isSpinning) {
        finalizeSpin(300); // shorter settle on fallback
      }
    }, ROULETTE_CONFIG.SPIN_DURATION + 800) as unknown as number;
  }, [currentCase, isSpinning, isOnline, spinUseCase, user.balance, playSound, startSpin]);

  const handleKeepPrize = useCallback(() => {
    if (spinResult && currentCase) {
      Analytics.trackSpinResult(currentCase.id, spinResult.prize);
      DomainEventBus.emit(DomainEventNames.PrizeWon, { type: 'PrizeWon', caseId: currentCase.id, prize: spinResult.prize, timestamp: Date.now() });
      addToInventory(spinResult.prize, currentCase.name);
      awardedRef.current = true;
      resetForNextSpin();
      resetRoulette();
    }
  }, [spinResult, currentCase, addToInventory, resetForNextSpin, resetRoulette]);

  const handleQuickSell = useCallback(() => {
    if (spinResult) {
      // Create an inventory record with status 'sold' for audit/history
      const inventoryId = addInventoryItem(spinResult.prize, currentCase?.name || 'QuickSell', 'sold');
      Analytics.trackItemSold(String(spinResult.prize.id), spinResult.prize.price);
      DomainEventBus.emit(DomainEventNames.ItemSold, { type: 'ItemSold', inventoryItemId: String(inventoryId), amount: spinResult.prize.price, timestamp: Date.now() });
      updateBalance(spinResult.prize.price);
      resetForNextSpin();
      resetRoulette();
    }
  }, [spinResult, updateBalance, resetForNextSpin, resetRoulette, addInventoryItem, currentCase]);

  const handleSkipSpin = useCallback(() => {
    if (!isSpinning) return;
    setInstantPosition(true);

    if (spinResult && currentCase) {
      // Jump the wheel to the final absolute position immediately
      setPosition(spinResult.position);
      // Allow DOM to update then finalize
      requestAnimationFrame(() => {
        finalizeSpin(0);
      });
    } else {
      endSpin();
    }

    clickLockRef.current = false;
  }, [isSpinning, spinResult, currentCase, finalizeSpin, endSpin]);

  const handleCloseCase = useCallback(() => {
    // Разрешаем закрытие кейса без потери выигрыша
    clickLockRef.current = false;
    if (spinResult && currentCase && !awardedRef.current) {
      addToInventory(spinResult.prize, currentCase.name);
      awardedRef.current = true;
    }
    resetRoulette();
    closeCase();
  }, [spinResult, currentCase, addToInventory, resetRoulette, closeCase]);

  useEffect(() => {
    if (!showResult && !isSpinning) {
      const timer = setTimeout(() => { resetRoulette(); }, 500);
      return () => clearTimeout(timer);
    }
  }, [showResult, isSpinning, resetRoulette]);

  // Cleanup timer when unmounting or when spin ends externally
  useEffect(() => {
    if (!isSpinning && spinEndTimerRef.current != null) {
      window.clearTimeout(spinEndTimerRef.current);
      spinEndTimerRef.current = null;
    }
  }, [isSpinning]);

  const hasEnoughFunds = useMemo(() => {
    const balance = new Money(user.balance);
    const price = new Money(currentCase?.price ?? 0);
    return balance.isGreaterThan(price) || balance.value === price.value || price.value === 0;
  }, [user.balance, currentCase?.price]);

  return [
    { position, instantPosition, targetReplicaIndex, previewPrize, hasEnoughFunds },
    { setPreviewPrize, handleSpin, handleAnimationEnd, handleKeepPrize, handleQuickSell, handleSkipSpin, resetRoulette, handleCloseCase }
  ];
};


