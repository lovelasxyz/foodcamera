import { useMemo, type CSSProperties } from 'react';
import { ROULETTE_CONFIG } from '@/types/game';

export const useSpinAnimation = (
  isSpinning: boolean,
  instantPosition: boolean,
  position: number
) => {
  const style = useMemo(() => ({
    transform: `translate(-50%, -50%) translateX(${position}px)`,
    transition: isSpinning && !instantPosition
      ? `transform ${ROULETTE_CONFIG.SPIN_DURATION}ms cubic-bezier(0.1, 0, 0.2, 1)`
      : 'none'
  }), [isSpinning, instantPosition, position]);

  return style as CSSProperties;
};


