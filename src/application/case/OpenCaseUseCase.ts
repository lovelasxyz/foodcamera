import { Case } from '@/types/game';

type UpdateBalanceFn = (amount: number) => void;
type NotifyFn = (params: { type: 'error' | 'success' | 'info'; message: string }) => void;

export class OpenCaseUseCase {
	constructor(updateBalance: UpdateBalanceFn, notify: NotifyFn) {
		// параметры передаются, но не используются в этой use case
		void updateBalance;
		void notify;
	}

	public tryOpen(caseData: Case, userBalance: number, insufficientMsg: string): boolean {
		// Вход в кейс не должен быть ограничен балансом и не должен списывать средства.
		// Ограничение и списание происходят непосредственно на спине (SpinUseCase).
		void caseData;
		void userBalance;
		void insufficientMsg;
		return true;
	}
}






