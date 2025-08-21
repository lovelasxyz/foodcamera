import { useCallback } from 'react';
import { useCasesStore } from '@/store/casesStore';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { Case } from '@/types/game';
import { CaseDomain } from '@/domain/case/CaseDomain';
import { OpenCaseUseCase } from '@/application/case/OpenCaseUseCase';
import { MESSAGES } from '@/utils/constants';

export const useCase = () => {
  const { cases } = useCasesStore();
  const { user, updateBalance } = useUserStore();
  const { addNotification } = useUIStore();

  const openCase = useCallback((caseData: Case) => {
    const uc = new OpenCaseUseCase(updateBalance, addNotification);
    return uc.tryOpen(caseData, user.balance, MESSAGES.INSUFFICIENT_FUNDS);
  }, [user.balance, updateBalance, addNotification]);

  const getCaseStatistics = useCallback((caseData: Case) => {
    return CaseDomain.statistics(caseData);
  }, []);

  const filterCasesByPrice = useCallback((maxPrice: number) => {
    return CaseDomain.filterByPrice(cases, maxPrice);
  }, [cases]);

  const sortCasesByPrice = useCallback((ascending: boolean = true) => {
    return CaseDomain.sortByPrice(cases, ascending);
  }, [cases]);

  return {
    cases,
    openCase,
    getCaseStatistics,
    filterCasesByPrice,
    sortCasesByPrice,
    canAffordCase: (caseData: Case) => CaseDomain.canAfford(caseData, user.balance),
    isFreeCase: CaseDomain.isFree
  };
}; 