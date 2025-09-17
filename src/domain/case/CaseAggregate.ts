import { Case, Prize } from '@/types/game';
import { Money } from '@/domain/common/Money';

export class CaseAggregate {
  private readonly caseData: Case;

  constructor(caseData: Case) {
    this.caseData = caseData;
  }

  public canOpen(balance: Money): boolean {
    const price = new Money(this.caseData.price);
    return balance.isGreaterThan(price) || balance.value === price.value || price.value === 0;
  }

  public calculateAveragePrizeValue(): number {
    if (!this.caseData.items.length) return 0;
    const sum = this.caseData.items.reduce((s, p) => s + (p.price || 0), 0);
    return Math.round((sum / this.caseData.items.length) * 100) / 100;
  }

  /**
   * Простая модель дроп-рейтов: чем дороже предмет, тем ниже вероятность.
   * Вес = 1 / clamp(price, 1, Infinity). Если price == 0, используем вес 1.
   */
  public calculateDropRates(): Map<Prize, number> {
    const items = this.caseData.items;
    if (!items.length) return new Map();
    const weights = items.map((p) => (p.price > 0 ? 1 / p.price : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    const rates = new Map<Prize, number>();
    items.forEach((p, i) => {
      rates.set(p, weights[i] / (total || 1));
    });
    return rates;
  }

  /**
   * Выбор приза по seed (0..1) согласно рассчитанным дроп-рейтам.
   */
  public selectPrize(seed: number): Prize {
    const rates = this.calculateDropRates();
    if (rates.size === 0) throw new Error('No prizes');
    const entries = Array.from(rates.entries());
    let acc = 0;
    for (const [prize, rate] of entries) {
      acc += rate;
      if (seed <= acc) return prize;
    }
    // fallback на последний при числовых погрешностях
    return entries[entries.length - 1][0];
  }
}


