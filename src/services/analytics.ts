import { Prize } from '@/types/game';

export interface IAnalytics {
  trackCaseOpened(caseId: number): void;
  trackSpinResult(caseId: number, result: Prize): void;
  trackItemSold(inventoryItemId: string, price: number): void;
  trackDepositMade(amount: number, method: string): void;
}

class ConsoleAnalytics implements IAnalytics {
  trackCaseOpened(caseId: number): void { if (process.env.NODE_ENV === 'development') console.log('[analytics] case_opened', { caseId }); }
  trackSpinResult(caseId: number, result: Prize): void { if (process.env.NODE_ENV === 'development') console.log('[analytics] spin_result', { caseId, result }); }
  trackItemSold(inventoryItemId: string, price: number): void { if (process.env.NODE_ENV === 'development') console.log('[analytics] item_sold', { inventoryItemId, price }); }
  trackDepositMade(amount: number, method: string): void { if (process.env.NODE_ENV === 'development') console.log('[analytics] deposit_made', { amount, method }); }
}

export const Analytics: IAnalytics = new ConsoleAnalytics();


