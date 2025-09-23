import { Prize } from './game';

export type UserStatus = 'regular' | 'premium' | 'advertiser';

export interface UserTelegramAccount {
  id: string;
  username?: string;
  registeredAt: number; // дата регистрации в приложении
  hasPhoto?: boolean;   // есть ли фото профиля в Telegram
  photoUrl?: string;    // оригинальный URL фото из Telegram (если есть)
}

export interface UserStats {
  spinsCount: number;
  lastAuthAt: number | null; // дата последней авторизации
}

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
  status: UserStatus; // обычный | премиум | рекламщик
  isAdmin?: boolean;
  perks?: {
    freeSpins?: boolean;         // бесплатные прокрутки
    unlimitedBalance?: boolean;  // неограниченный баланс
  };
  telegram?: UserTelegramAccount; // данные аккаунта телеграм
  stats?: UserStats;              // статистика (прокруты, дата авторизации)
  inventory: InventoryItem[];
  // Прогресс по осколкам: ключ набора -> текущее количество
  shards?: Record<string, number>;
  // Метка времени последнего изменения количества осколков по ключу
  shardUpdatedAt?: Record<string, number>;
  // Последний полученный дроп, чтобы отображать его первым в инвентаре
  lastDrop?: LastDrop | null;
}

export interface InventoryItem {
  id: string;
  prize: Prize;
  obtainedAt: number;
  fromCase: string;
  status?: 'active' | 'received' | 'sold';
} 