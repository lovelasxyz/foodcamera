import { Case } from '@/types/game';
import { CASE_GRADIENT_COLORS, PRICE_THRESHOLDS } from '@/utils/constants';

export class CaseService {
  /**
   * Получает цвет градиента для кейса на основе его цены
   */
  static getGradientColor(price: number): string {
    if (price === PRICE_THRESHOLDS.FREE) return CASE_GRADIENT_COLORS.FREE;
    if (price <= PRICE_THRESHOLDS.LOW) return CASE_GRADIENT_COLORS.LOW;
    if (price <= PRICE_THRESHOLDS.MEDIUM) return CASE_GRADIENT_COLORS.MEDIUM;
    if (price <= PRICE_THRESHOLDS.HIGH) return CASE_GRADIENT_COLORS.HIGH;
    if (price <= PRICE_THRESHOLDS.EXPENSIVE) return CASE_GRADIENT_COLORS.EXPENSIVE;
    return CASE_GRADIENT_COLORS.PREMIUM;
  }

  /**
   * Проверяет, является ли кейс бесплатным
   */
  static isFreeCase(caseData: Case): boolean {
    return caseData.price === PRICE_THRESHOLDS.FREE;
  }

  /**
   * Проверяет, достаточно ли средств для открытия кейса
   */
  static canAffordCase(caseData: Case, userBalance: number): boolean {
    return caseData.price === PRICE_THRESHOLDS.FREE || userBalance >= caseData.price;
  }

  /**
   * Получает стили фона для кейса
   */
  static getBackgroundStyle(caseData: Case): React.CSSProperties {
    if (this.isFreeCase(caseData)) {
      return {}; // Для FREE кейса используется отдельный CSS стиль
    }

    const gradientColor = this.getGradientColor(caseData.price);
    return {
      background: `radial-gradient(61.63% 100.04% at 43.18% 123.86%, ${gradientColor}40 0%, ${gradientColor}00 100%), linear-gradient(rgba(20, 20, 21, 0) 0%, rgb(20, 20, 21) 100%)`
    };
  }

  /**
   * Фильтрует кейсы по цене
   */
  static filterCasesByPrice(cases: Case[], maxPrice: number): Case[] {
    return cases.filter(caseData => caseData.price <= maxPrice);
  }

  /**
   * Сортирует кейсы по цене
   */
  static sortCasesByPrice(cases: Case[], ascending: boolean = true): Case[] {
    return [...cases].sort((a, b) => {
      return ascending ? a.price - b.price : b.price - a.price;
    });
  }

  /**
   * Получает статистику по кейсу
   */
  static getCaseStatistics(caseData: Case) {
    const totalItems = caseData.items.length;
    const totalValue = caseData.items.reduce((sum, item) => sum + item.price, 0);
    const averageValue = totalValue / totalItems;
    const maxValue = Math.max(...caseData.items.map(item => item.price));
    const minValue = Math.min(...caseData.items.map(item => item.price));

    return {
      totalItems,
      totalValue,
      averageValue,
      maxValue,
      minValue,
      roi: totalValue / caseData.price // Return on Investment
    };
  }
} 