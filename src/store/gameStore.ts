import { create } from 'zustand';
import { Case, GameSession, SpinResult } from '@/types/game';
// Логика рулетки вынесена в домен/UI; стор лишь хранит состояние

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
    
    // Результат определяется выше (в UI/use case); при отсутствии — выберем случайно
    const selectedIndex = (winningIndex !== undefined)
      ? winningIndex
      : Math.floor(Math.random() * currentCase.items.length);

    const prize = currentCase.items[selectedIndex];
    const result: SpinResult = {
      prize,
      position: selectedIndex,
      timestamp: Date.now()
    };

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