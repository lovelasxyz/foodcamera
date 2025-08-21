import { Case, Prize } from '@/types/game';
import { RouletteEngine, SpinOutcome } from '@/domain/roulette/RouletteEngine';

type UpdateBalanceFn = (amount: number) => void;
type AddToInventoryFn = (prize: Prize, fromCase: string) => void;

/**
 * Application Layer Use Case: Spin
 * Инкапсулирует оркестрацию бизнес-логики спина.
 */
export class SpinUseCase {
	private readonly engine: RouletteEngine;
	private readonly updateBalance: UpdateBalanceFn;
	private readonly addToInventory: AddToInventoryFn;

	constructor(
		engine: RouletteEngine,
		deps: { updateBalance: UpdateBalanceFn; addToInventory: AddToInventoryFn }
	) {
		this.engine = engine;
		this.updateBalance = deps.updateBalance;
		this.addToInventory = deps.addToInventory;
	}

	public canAfford(caseData: Case, balance: number): boolean {
		return balance >= caseData.price;
	}

	/** Начинает спин: списывает средства и вычисляет исход. */
	public beginSpin(caseData: Case, userBalance: number, reelLength: number): SpinOutcome | null {
		if (!this.canAfford(caseData, userBalance)) return null;
		this.updateBalance(-caseData.price);
		return this.engine.generateSpinOutcome(caseData, reelLength);
	}

	/** Выдает приз пользователю. */
	public award(caseData: Case, prize: Prize): void {
		this.addToInventory(prize, caseData.name);
	}
}


