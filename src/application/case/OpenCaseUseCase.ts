import { Case } from '@/types/game';
import { CaseDomain } from '@/domain/case/CaseDomain';

type UpdateBalanceFn = (amount: number) => void;
type NotifyFn = (params: { type: 'error' | 'success' | 'info'; message: string }) => void;

export class OpenCaseUseCase {
	constructor(private readonly updateBalance: UpdateBalanceFn, private readonly notify: NotifyFn) {}

	public tryOpen(caseData: Case, userBalance: number, insufficientMsg: string): boolean {
		if (!CaseDomain.canAfford(caseData, userBalance)) {
			this.notify({ type: 'error', message: insufficientMsg });
			return false;
		}
		if (!CaseDomain.isFree(caseData)) {
			this.updateBalance(-caseData.price);
		}
		return true;
	}
}



