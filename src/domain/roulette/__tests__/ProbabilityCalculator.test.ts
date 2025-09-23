import { describe, it, expect } from 'vitest';
import { ProbabilityCalculator } from '@/domain/roulette/ProbabilityCalculator';
import type { Prize } from '@/types/game';

const makePrize = (id: number, price: number): Prize => ({ id, name: String(id), price, image: '', rarity: 'common' });

describe('ProbabilityCalculator', () => {
  it('sums probabilities to 1 (within epsilon)', () => {
    const prizes: Prize[] = [makePrize(1, 1), makePrize(2, 4), makePrize(3, 16)];
    const res = ProbabilityCalculator.calculateProbabilities(prizes);
    const sum = res.reduce((a, b) => a + b.p, 0);
    expect(sum).toBeGreaterThan(0.999999);
    expect(sum).toBeLessThan(1.000001);
  });

  it('probabilities decrease with EV for base weights', () => {
    const prizes: Prize[] = [makePrize(1, 1), makePrize(2, 4), makePrize(3, 16)];
    const res = ProbabilityCalculator.calculateProbabilities(prizes);
    // ev ascending => p descending
    expect(res.find(r => r.id === 1)!.p).toBeGreaterThan(res.find(r => r.id === 2)!.p);
    expect(res.find(r => r.id === 2)!.p).toBeGreaterThan(res.find(r => r.id === 3)!.p);
  });

  it('modifier M>1 increases high-EV probability relatively', () => {
    const prizes: Prize[] = [makePrize(1, 1), makePrize(2, 4), makePrize(3, 16)];
    const base = ProbabilityCalculator.calculateProbabilities(prizes);
    const withM = ProbabilityCalculator.calculateProbabilities(prizes, { happyHoursMultiplier: 2 });
    const pBaseHigh = base.find(r => r.id === 3)!.p;
    const pWithMHigh = withM.find(r => r.id === 3)!.p;
    expect(pWithMHigh).toBeGreaterThan(pBaseHigh);
    const pBaseLow = base.find(r => r.id === 1)!.p;
    const pWithMLow = withM.find(r => r.id === 1)!.p;
    expect(pWithMLow).toBeLessThan(pBaseLow);
  });

  it('modifier M<1 favors low-EV items', () => {
    const prizes: Prize[] = [makePrize(1, 1), makePrize(2, 4), makePrize(3, 16)];
    const base = ProbabilityCalculator.calculateProbabilities(prizes);
    const withLowM = ProbabilityCalculator.calculateProbabilities(prizes, { registeredDays: 0 }); // <7 -> M*=0.5
    const pLowEV_base = base.find(r => r.id === 1)!.p;
    const pLowEV_lowM = withLowM.find(r => r.id === 1)!.p;
    expect(pLowEV_lowM).toBeGreaterThan(pLowEV_base);
  });
});
