import { create } from 'zustand';
import { Case, GameSession, SpinResult } from '@/types/game';
import { RouletteService } from '@/services/RouletteService';

interface GameState {
  currentCase: Case | null;
  isSpinning: boolean;
  currentSession: GameSession | null;
  spinResult: SpinResult | null;
  showResult: boolean;
}

interface GameActions {
  openCase: (caseData: Case, isDemo: boolean) => void;
  closeCase: () => void;
  startSpin: (finalPosition?: number) => void;
  endSpin: () => void;
  resetForNextSpin: () => void;
  finishSpin: (result: SpinResult) => void;
  showSpinResult: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  currentCase: null,
  isSpinning: false,
  currentSession: null,
  spinResult: null,
  showResult: false,

  openCase: (caseData, isDemo) => {
    const session: GameSession = {
      caseId: caseData.id,
      isDemo,
      startTime: Date.now()
    };

    set({
      currentCase: caseData,
      currentSession: session,
      isSpinning: false,
      spinResult: null,
      showResult: false
    });
  },

  closeCase: () => {
    set({
      currentCase: null,
      currentSession: null,
      isSpinning: false,
      spinResult: null,
      showResult: false
    });
  },

  startSpin: (winningIndex) => {
    const { currentCase } = get();
    if (!currentCase) return;

    set({ isSpinning: true, showResult: false });
    
    // Результат будет определен заранее, но показан только после анимации
    const selectedIndex = (winningIndex !== undefined)
      ? winningIndex
      : RouletteService.generateWinningIndex(currentCase.items.length);

    const result = RouletteService.createSpinResult(currentCase, selectedIndex);

    set({ spinResult: result });
  },

  endSpin: () => {
    set((state) => ({
      isSpinning: false,
      showResult: true,
      currentSession: state.currentSession && state.spinResult ? {
        ...state.currentSession,
        result: state.spinResult,
      } : state.currentSession
    }));
  },

  resetForNextSpin: () => {
    set({
      isSpinning: false,
      spinResult: null,
      showResult: false,
    });
  },

  finishSpin: (result) => {
    set((state) => ({
      isSpinning: false,
      spinResult: result,
      currentSession: state.currentSession ? {
        ...state.currentSession,
        result
      } : null
    }));
  },

  showSpinResult: () => {
    set({ showResult: true });
  },

  resetGame: () => {
    set({
      currentCase: null,
      currentSession: null,
      isSpinning: false,
      spinResult: null,
      showResult: false
    });
  }
})); 