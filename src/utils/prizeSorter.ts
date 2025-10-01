import { Prize } from '@/types/game';

/**
 * Utility class for sorting prizes by rarity.
 * Follows Single Responsibility Principle - only responsible for prize sorting logic.
 */
export class PrizeSorter {
  private static readonly RARITY_ORDER: Record<Prize['rarity'], number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3
  };

  /**
   * Sorts prizes by rarity in descending order (legendary first, common last).
   * Returns a new array, does not mutate the original.
   *
   * @param prizes - Array of prizes to sort
   * @returns New sorted array
   */
  static sortByRarity(prizes: Prize[]): Prize[] {
    return [...prizes].sort((a, b) =>
      this.RARITY_ORDER[a.rarity] - this.RARITY_ORDER[b.rarity]
    );
  }

  /**
   * Gets the numeric order value for a given rarity.
   * Lower numbers indicate higher rarity (more rare).
   *
   * @param rarity - The rarity level
   * @returns Numeric order value
   */
  static getRarityOrder(rarity: Prize['rarity']): number {
    return this.RARITY_ORDER[rarity];
  }
}
