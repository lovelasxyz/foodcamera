import { Prize } from './game';

export interface User {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  wallet?: string;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  prize: Prize;
  obtainedAt: number;
  fromCase: string;
} 