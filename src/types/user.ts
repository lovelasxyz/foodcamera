import { Prize } from './game';

export interface LastDrop {
  kind: 'item' | 'shard';
  id: string; // inventory item id for items, shardKey for shards
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  wallet?: string;
  inventory: InventoryItem[];
  // Прогресс по осколкам: ключ набора -> текущее количество
  shards?: Record<string, number>;
  // Последний полученный дроп, чтобы отображать его первым в инвентаре
  lastDrop?: LastDrop | null;
}

export interface InventoryItem {
  id: string;
  prize: Prize;
  obtainedAt: number;
  fromCase: string;
} 