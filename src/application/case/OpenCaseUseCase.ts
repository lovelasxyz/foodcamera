import { Case } from '@/types/game';
import { CaseDomain } from '@/domain/case/CaseDomain';

type UpdateBalanceFn = (amount: number) => void;
type NotifyFn = (params: { type: 'error' | 'success' | 'info'; message: string }) => void;

export class OpenCaseUseCase {
	constructor(private readonly updateBalance: UpdateBalanceFn, private readonly notify: NotifyFn) {}

	public tryOpen(caseData: Case, userBalance: number, insufficientMsg: string): boolean {
		// Вход в кейс не должен быть ограничен балансом и не должен списывать средства.
		// Ограничение и списание происходят непосредственно на спине (SpinUseCase).
		return true;
	}
}






