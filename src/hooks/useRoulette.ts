import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUserStore } from '@/store/userStore';

import { RouletteService } from '@/services/RouletteService';
import { MULTIPLIERS } from '@/types/game';

export const useRoulette = () => {
  const { 
    currentCase, 
    isSpinning, 
    spinResult, 
    showResult, 
    startSpin, 
    closeCase 
  } = useGameStore();
  const { user, updateBalance } = useUserStore();
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);
  const [finalPosition, setFinalPosition] = useState(0);

  const handleSpin = useCallback(() => {
    if (!currentCase) return;

    if (!RouletteService.canAffordSpin(currentCase, selectedMultiplier, user.balance)) {
      return;
    }
    
    // Списываем средства за спин
    const spinCost = RouletteService.calculateSpinCost(currentCase, selectedMultiplier);
    updateBalance(-spinCost);
    
    const randomItemIndex = RouletteService.generateWinningIndex(currentCase.items.length);
    const position = RouletteService.calculateFinalPosition(randomItemIndex, currentCase.items.length);
    setFinalPosition(position);
    
    startSpin(randomItemIndex);
  }, [currentCase, selectedMultiplier, user.balance, startSpin, updateBalance]);


  const handleClose = useCallback(() => {
    setFinalPosition(0);
    closeCase();
  }, [closeCase]);

  const handleMultiplierChange = useCallback((multiplier: number) => {
    if (!isSpinning) {
      setSelectedMultiplier(multiplier);
    }
  }, [isSpinning]);

  const resetPosition = useCallback(() => {
    setFinalPosition(0);
  }, []);

  const getAnimationConfig = useCallback(() => {
    return RouletteService.getAnimationConfig(isSpinning, finalPosition);
  }, [isSpinning, finalPosition]);

  const getRouletteItems = useCallback(() => {
    if (!currentCase) return [];
    return RouletteService.createRouletteItems(currentCase);
  }, [currentCase]);

  const canAffordSpin = useCallback(() => {
    if (!currentCase) return false;
    return RouletteService.canAffordSpin(currentCase, selectedMultiplier, user.balance);
  }, [currentCase, selectedMultiplier, user.balance]);

  const getSpinCost = useCallback(() => {
    if (!currentCase) return 0;
    return RouletteService.calculateSpinCost(currentCase, selectedMultiplier);
  }, [currentCase, selectedMultiplier]);

  return {
    // State
    currentCase,
    isSpinning,
    spinResult,
    showResult,
    selectedMultiplier,
    finalPosition,
    
    // Actions
    handleSpin,
    handleClose,
    handleMultiplierChange,
    resetPosition,
    
    // Computed values
    getAnimationConfig,
    getRouletteItems,
    canAffordSpin,
    getSpinCost,
    
    // Constants
    multipliers: MULTIPLIERS
  };
}; 