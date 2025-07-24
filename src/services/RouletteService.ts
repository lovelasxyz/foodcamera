import { Case, SpinResult, ROULETTE_CONFIG } from '@/types/game';

export class RouletteService {
  /**
   * Рассчитывает финальную позицию анимации рулетки
   */
  static calculateFinalPosition(winningIndex: number, totalItems: number): number {
    const { ITEM_WIDTH, BASE_SPINS } = ROULETTE_CONFIG;
    const baseDistance = BASE_SPINS * totalItems * ITEM_WIDTH;
    const winningPosition = winningIndex * ITEM_WIDTH;
    const centerOffset = ITEM_WIDTH / 2;
    
    return -(baseDistance + winningPosition - centerOffset);
  }

  /**
   * Генерирует случайный выигрышный индекс
   */
  static generateWinningIndex(totalItems: number): number {
    return Math.floor(Math.random() * totalItems);
  }

  /**
   * Создает результат спина
   */
  static createSpinResult(caseData: Case, winningIndex: number): SpinResult {
    return {
      prize: caseData.items[winningIndex],
      position: winningIndex,
      timestamp: Date.now()
    };
  }

  /**
   * Создает массив элементов для рулетки с дублированием
   */
  static createRouletteItems(caseData: Case, repetitions: number = 200) {
    const rouletteItems = [];
    for (let i = 0; i < repetitions; i++) {
      const item = caseData.items[i % caseData.items.length];
      rouletteItems.push({
        ...item,
        uniqueId: `${item.id}-${i}`
      });
    }
    return rouletteItems;
  }

  /**
   * Проверяет, достаточно ли средств для спина
   */
  static canAffordSpin(caseData: Case, multiplier: number, userBalance: number): boolean {
    const totalPrice = caseData.price * multiplier;
    return userBalance >= totalPrice;
  }

  /**
   * Рассчитывает общую стоимость спина
   */
  static calculateSpinCost(caseData: Case, multiplier: number): number {
    return caseData.price * multiplier;
  }

  /**
   * Получает конфигурацию анимации для react-spring
   */
  static getAnimationConfig(isSpinning: boolean, finalPosition: number) {
    const { SPIN_DURATION, ANIMATION_EASING } = ROULETTE_CONFIG;
    
    return {
      from: { transform: 'translateX(0px)' },
      to: { 
        transform: isSpinning ? `translateX(${finalPosition}px)` : 'translateX(0px)'
      },
      config: { 
        duration: isSpinning ? SPIN_DURATION : 300,
        easing: isSpinning ? ANIMATION_EASING : (t: number) => t
      }
    };
  }

  /**
   * Проверяет, является ли приз редким
   */
  static isRarePrize(prize: any): boolean {
    return prize.rarity === 'rare' || prize.rarity === 'epic' || prize.rarity === 'legendary';
  }

  /**
   * Получает множитель выигрыша на основе редкости приза
   */
  static getPrizeMultiplier(prize: any): number {
    switch (prize.rarity) {
      case 'legendary': return 10;
      case 'epic': return 5;
      case 'rare': return 2;
      default: return 1;
    }
  }
} 