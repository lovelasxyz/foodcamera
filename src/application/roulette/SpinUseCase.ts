import { Case, Prize } from '@/types/game';
type UserPerks = { freeSpins?: boolean; unlimitedBalance?: boolean };
import { RouletteEngine, SpinOutcome } from '@/domain/roulette/RouletteEngine';
import { ISpinGateway } from '@/application/roulette/ISpinGateway';
import { ProbabilityCalculator } from '@/domain/roulette/ProbabilityCalculator';

interface SpinPaymentPolicy {
	shouldCharge(perks?: UserPerks): boolean;
}

class DefaultSpinPaymentPolicy implements SpinPaymentPolicy {
	shouldCharge(perks?: UserPerks): boolean {
		return !(perks?.freeSpins || perks?.unlimitedBalance);
	}
}

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
	private readonly payment: SpinPaymentPolicy;
	private readonly gateway?: ISpinGateway;

			constructor(
				engine: RouletteEngine,
				deps: { updateBalance: UpdateBalanceFn; addToInventory: AddToInventoryFn },
				payment: SpinPaymentPolicy = new DefaultSpinPaymentPolicy(),
				gateway?: ISpinGateway
			) {
			this.engine = engine;
			this.updateBalance = deps.updateBalance;
			this.addToInventory = deps.addToInventory;
			this.payment = payment;
				this.gateway = gateway;
		}

	public canAfford(caseData: Case, balance: number): boolean {
			return balance >= caseData.price;
	}

		/** Начинает спин: проверка оплаты (политика) и генерация исхода.
		 * Если доступен gateway — запрашиваем prizeId у бэкенда, иначе считаем локально по вероятностям.
		 */
			public async beginSpin(
			caseData: Case,
			userBalance: number,
			reelLength: number,
			perks?: UserPerks,
			ctx?: Parameters<typeof ProbabilityCalculator.calculateProbabilities>[1]
		): Promise<SpinOutcome | null> {
		const shouldCharge = this.payment.shouldCharge(perks);
		if (shouldCharge && !this.canAfford(caseData, userBalance)) {
			return null;
		}
		if (shouldCharge) {
			this.updateBalance(-caseData.price);
		}
			// Try backend first unless forced local
			const forceLocal = (import.meta as any).env?.VITE_FORCE_LOCAL_SPIN === 'true' || false;
			if (this.gateway && !forceLocal) {
				try {
					const items = caseData.items.map(i => ({ id: i.id, ev: Math.max(1, i.price) }));
					const resp = await this.gateway.requestSpin({ caseId: caseData.id, items });
					const prizeIndex = Math.max(0, caseData.items.findIndex(p => p.id === resp.prizeId));
					if (prizeIndex !== -1) return this.engine.outcomeForPrizeIndex(caseData, prizeIndex, reelLength);
				} catch {
					// fallthrough to local calc
				}
			}
			// Local probability-based selection (approximate spec)
			const probs = ProbabilityCalculator.calculateProbabilities(caseData.items, ctx);
			let r = Math.random();
			let chosenId = probs[probs.length - 1].id;
			for (const e of probs) {
				if ((r -= e.p) <= 0) { chosenId = e.id; break; }
			}
			const idx = Math.max(0, caseData.items.findIndex(p => p.id === chosenId));
			return this.engine.outcomeForPrizeIndex(caseData, idx, reelLength);
	}

	/** Выдает приз пользователю. */
	public award(caseData: Case, prize: Prize): void {
		this.addToInventory(prize, caseData.name);
	}
}


