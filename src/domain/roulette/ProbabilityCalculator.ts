import { Prize } from '@/types/game';

export interface ModifierContext {
  avatarBonus?: number; // e.g., +0.5
  happyHoursMultiplier?: number; // e.g., 2
  historyCommonWinsBoost?: number; // e.g., +0.5 if many commons
  spinCount?: number; // total user spins
  registeredDays?: number; // days since registration
  depositTotal?: number; // total deposit amount
  depositFrequency?: number; // per week
}

export interface ProbabilityEntry {
  id: number;
  ev: number;
  p: number;
}

/**
 * Implements EV-based base weights and optional modifier normalization.
 * Base: wi = 1 / sqrt(EV_i), then Pi = wi / sum(w)
 * Normalization: w*_i = w_i * M^{g_i}, Pi* = w*_i / sum(w*)
 * where g_i = (ln(EV_i) - ln(EV_min)) / (ln(EV_max) - ln(EV_min))   in [0,1]
 */
export class ProbabilityCalculator {
  public static baseWeightsByEV(items: { id: number; ev: number }[]): number[] {
    return items.map(i => 1 / Math.sqrt(Math.max(1e-6, i.ev)));
  }

  private static sensitivity(ev: number, evMin: number, evMax: number): number {
    const a = Math.log(Math.max(ev, 1e-6));
    const min = Math.log(Math.max(evMin, 1e-6));
    const max = Math.log(Math.max(evMax, 1e-6));
    const denom = Math.max(1e-9, max - min);
    return (a - min) / denom; // 0..1
  }

  private static deriveModifier(ctx?: ModifierContext): number {
    if (!ctx) return 1;
    let M = 1;
    if (ctx.happyHoursMultiplier && ctx.happyHoursMultiplier > 0) M *= ctx.happyHoursMultiplier;
    if (ctx.avatarBonus && ctx.avatarBonus !== 0) M *= 1 + ctx.avatarBonus;
    if (ctx.historyCommonWinsBoost && ctx.historyCommonWinsBoost !== 0) M *= 1 + ctx.historyCommonWinsBoost;
    // Spin history influence: until 20 spins — dampen; after 20 — boost
    // if (typeof ctx.spinCount === 'number') {
    //   if (ctx.spinCount < 20) M *= 0.5; else if (ctx.spinCount >= 20) M *= 1.5;
    // }
    if (ctx.registeredDays != null) {
      if (ctx.registeredDays < 7) M *= 0.5; else M *= 1.5;
    }
    if (ctx.depositTotal && ctx.depositTotal >= 10000) M *= 2;
    if (ctx.depositFrequency && ctx.depositFrequency > 0) M *= 1 + 0.1 * ctx.depositFrequency;
    return Math.max(0.1, Math.min(M, 10));
  }

  public static calculateProbabilities(
    prizes: Prize[],
    ctx?: ModifierContext
  ): ProbabilityEntry[] {
    const items = prizes.map(p => ({ id: p.id, ev: Math.max(1, p.price) }));
    const baseWeights = this.baseWeightsByEV(items);
    const evs = items.map(i => i.ev);
    const evMin = Math.min(...evs);
    const evMax = Math.max(...evs);
    const M = this.deriveModifier(ctx);

    const adjusted = items.map((it, idx) => {
      const g = this.sensitivity(it.ev, evMin, evMax); // 0..1
      const wStar = baseWeights[idx] * Math.pow(M, g);
      return wStar;
    });
    const sum = adjusted.reduce((a, b) => a + b, 0) || 1;
    return items.map((it, idx) => ({ id: it.id, ev: it.ev, p: adjusted[idx] / sum }));
  }
}
