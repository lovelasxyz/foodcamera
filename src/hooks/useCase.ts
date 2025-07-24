import { useCallback } from 'react';
import { useCasesStore } from '@/store/casesStore';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { Case } from '@/types/game';
import { CaseService } from '@/services/CaseService';
import { MESSAGES } from '@/utils/constants';

export const useCase = () => {
  const { cases } = useCasesStore();
  const { user, updateBalance } = useUserStore();
  const { addNotification } = useUIStore();

  const openCase = useCallback((caseData: Case) => {
    if (!CaseService.canAffordCase(caseData, user.balance)) {
      addNotification({
        type: 'error',
        message: MESSAGES.INSUFFICIENT_FUNDS
      });
      return false;
    }

    // Списываем средства если кейс не бесплатный
    if (!CaseService.isFreeCase(caseData)) {
      updateBalance(-caseData.price);
    }

    return true;
  }, [user.balance, updateBalance, addNotification]);

  const getCaseStatistics = useCallback((caseData: Case) => {
    return CaseService.getCaseStatistics(caseData);
  }, []);

  const filterCasesByPrice = useCallback((maxPrice: number) => {
    return CaseService.filterCasesByPrice(cases, maxPrice);
  }, [cases]);

  const sortCasesByPrice = useCallback((ascending: boolean = true) => {
    return CaseService.sortCasesByPrice(cases, ascending);
  }, [cases]);

  return {
    cases,
    openCase,
    getCaseStatistics,
    filterCasesByPrice,
    sortCasesByPrice,
    canAffordCase: (caseData: Case) => CaseService.canAffordCase(caseData, user.balance),
    isFreeCase: CaseService.isFreeCase
  };
}; 