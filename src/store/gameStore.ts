import { create } from 'zustand';
import { Case, GameSession, SpinResult } from '@/types/game';
import { RouletteService } from '@/services/RouletteService';
import { ROULETTE_CONFIG } from '@/types/game';

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

    // Симуляция спина с задержкой
    setTimeout(() => {
      let selectedIndex;
      
      if (winningIndex !== undefined) {
        // Определяем приз по переданному индексу
        selectedIndex = winningIndex;
      } else {
        // Случайный выбор (для обратной совместимости)
        selectedIndex = RouletteService.generateWinningIndex(currentCase.items.length);
      }
      
      const result = RouletteService.createSpinResult(currentCase, selectedIndex);

      set((state) => ({
        isSpinning: false,
        spinResult: result,
        currentSession: state.currentSession ? {
          ...state.currentSession,
          result
        } : null
      }));

      // Показываем результат через небольшую задержку
      setTimeout(() => {
        set({ showResult: true });
      }, ROULETTE_CONFIG.RESULT_DELAY);
    }, ROULETTE_CONFIG.SPIN_DURATION);
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