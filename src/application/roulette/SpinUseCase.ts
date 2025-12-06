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

	private enrichOutcomeWithServer(outcome: SpinOutcome, resp: { serverPrize?: { id: number; name?: string; price?: number; rarity?: string; image?: string }; position?: number; raw?: unknown; userPatch?: any; serverHandled?: boolean }): SpinOutcome {
		if (!resp.serverPrize) return outcome;
		const serverPrize = resp.serverPrize;
		// Create a shallow copy to avoid mutating original outcome (functional style)
		const normalizedRarity = serverPrize.rarity && ['common','rare','epic','legendary'].includes(serverPrize.rarity)
			? serverPrize.rarity as Prize['rarity']
			: undefined;
		const next: SpinOutcome = {
			...outcome,
			prize: { ...outcome.prize },
			server: { 
				prize: { ...serverPrize, rarity: normalizedRarity }, 
				position: resp.position, 
				raw: resp.raw, 
				userPatch: resp.userPatch,
				serverHandled: resp.serverHandled ?? true // Mark as server-handled if we got here
			}
		};
		if (serverPrize.name) next.prize.name = serverPrize.name;
		if (typeof serverPrize.price === 'number') next.prize.price = serverPrize.price;
		if (normalizedRarity) (next.prize as any).rarity = normalizedRarity; // safe narrowed union
		if (serverPrize.image) next.prize.image = serverPrize.image;
		return next;
	}

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
		let debited = false;
			// Try backend first unless forced local
			const forceLocal = (import.meta as any).env?.VITE_FORCE_LOCAL_SPIN === 'true' || false;
			if (this.gateway && !forceLocal) {
				try {
					const items = caseData.items.map(i => ({ id: i.id, ev: Math.max(1, i.price), rarity: i.rarity, benefitType: (i.benefit as any)?.type }));
					const resp = await this.gateway.requestSpin({ caseId: caseData.id, items });
					const prizeIndex = Math.max(0, caseData.items.findIndex(p => p.id === resp.prizeId));
					if (prizeIndex !== -1) {
						const outcome = this.engine.outcomeForPrizeIndex(caseData, prizeIndex, reelLength);
						// Late local debit only if server didn't return authoritative balance (userPatch.balance)
						if (shouldCharge && !(resp.userPatch && typeof resp.userPatch.balance === 'number')) {
							this.updateBalance(-caseData.price);
							debited = true;
						}
						return this.enrichOutcomeWithServer(outcome, resp);
					}
				} catch (err) {
  					console.error('[SpinUseCase] API spin failed, falling back to local:', err);
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
		// Local path: apply debit if needed and not debited yet
		if (shouldCharge && !debited) {
			this.updateBalance(-caseData.price);
		}
			return this.engine.outcomeForPrizeIndex(caseData, idx, reelLength);
	}

	/** Выдает приз пользователю. */
	public award(caseData: Case, prize: Prize): void {
		this.addToInventory(prize, caseData.name);
	}
}


