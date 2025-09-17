import { Prize } from '@/types/game';

export type CaseOpenedEvent = {
  type: 'CaseOpened';
  caseId: number;
  timestamp: number;
};

export type PrizeWonEvent = {
  type: 'PrizeWon';
  caseId: number;
  prize: Prize;
  timestamp: number;
};

export type ItemSoldEvent = {
  type: 'ItemSold';
  inventoryItemId: string;
  amount: number;
  timestamp: number;
};

export type DepositMadeEvent = {
  type: 'DepositMade';
  amount: number;
  method: string;
  timestamp: number;
};

export type DomainEvent = CaseOpenedEvent | PrizeWonEvent | ItemSoldEvent | DepositMadeEvent;

export const DomainEventNames = {
  CaseOpened: 'CaseOpened',
  PrizeWon: 'PrizeWon',
  ItemSold: 'ItemSold',
  DepositMade: 'DepositMade'
} as const;




