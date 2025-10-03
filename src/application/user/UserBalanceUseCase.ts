import { Money } from '@/domain/common/Money';

/**
 * Use Case: User Balance Operations
 * Extracted from store to keep business logic separate from state management
 */
export class UserBalanceUseCase {
	/**
	 * Update user balance with amount (can be positive or negative)
	 */
	static updateBalance(currentBalance: number, amount: number): number {
		const balance = new Money(currentBalance);
		const delta = new Money(amount);

		if (amount >= 0) {
			return balance.add(delta).value;
		} else {
			return balance.subtract(new Money(Math.abs(amount))).value;
		}
	}

	/**
	 * Check if user can afford a purchase
	 */
	static canAfford(currentBalance: number, price: number): boolean {
		const balance = new Money(currentBalance);
		const cost = new Money(price);
		return balance.isGreaterThan(cost) || balance.value === cost.value;
	}

	/**
	 * Deduct amount from balance with validation
	 */
	static deduct(currentBalance: number, amount: number): { success: boolean; newBalance: number; error?: string } {
		if (!this.canAfford(currentBalance, amount)) {
			return {
				success: false,
				newBalance: currentBalance,
				error: 'Insufficient balance'
			};
		}

		return {
			success: true,
			newBalance: this.updateBalance(currentBalance, -amount)
		};
	}

	/**
	 * Add amount to balance
	 */
	static credit(currentBalance: number, amount: number): number {
		if (amount < 0) {
			throw new Error('Credit amount must be positive');
		}
		return this.updateBalance(currentBalance, amount);
	}
}
