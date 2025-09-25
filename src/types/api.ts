export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  // Optional machine-readable code (future)
  code?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
} 

// === Unified API Models (proposed contract) ===

// Inventory item coming from backend (flattened prize refs allowed)
export interface ApiInventoryItem {
  id: string;
  prizeId: number;        // reference to prize catalog
  fromCase: string;       // case identifier or source label
  obtainedAt: number;     // epoch ms
  status?: 'active' | 'received' | 'sold';
  // Optional pre-expanded prize (server may embed to reduce extra roundtrip)
  prize?: ApiPrize;
}

// Prize DTO (subset of domain Prize to keep server contract stable)
export interface ApiPrize {
  id: number;
  name: string;
  price: number;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isShard?: boolean;
  shardKey?: string;
  shardsRequired?: number;
  description?: string;
  nonRemovableGift?: boolean;
}

export interface ApiUserStats {
  spinsCount: number;
  lastAuthAt: number | null;
}

export interface ApiUserTelegram {
  id: string;
  username?: string;
  hasPhoto?: boolean;
  photoUrl?: string;
  registeredAt: number;
}

export interface ApiUser {
  id: string;
  name: string;
  avatar: string; // direct URL or CDN path
  balance: number;
  status: 'regular' | 'premium' | 'advertiser';
  isAdmin?: boolean;
  inventory: ApiInventoryItem[];
  shards?: Record<string, number>;
  shardUpdatedAt?: Record<string, number>;
  lastDrop?: { kind: 'item' | 'shard'; id: string } | null;
  stats?: ApiUserStats;
  telegram?: ApiUserTelegram;
  // Reserved for future perks / flags:
  perks?: { freeSpins?: boolean; unlimitedBalance?: boolean };
}

export interface AuthResponse {
  token: string; // bearer token
  expiresIn?: number; // seconds
  refreshToken?: string; // optional if refresh flow needed
}

export interface ApiSpinResult {
  spinId: string;
  caseId: string | number;
  prize: ApiPrize;      // awarded prize
  position: number;     // index used for animation alignment
  timestamp: number;    // epoch ms
  balanceDelta?: number; // how balance changed (if server debits cost & credits prize)
  userPatch?: Partial<ApiUser> & { balance?: number; stats?: ApiUserStats }; // optional incremental patch
}

// Cases (catalog)
export interface ApiCasePrizeRef {
  id: number; // prize id
  name: string;
  price: number;
  rarity: string;
  image: string;
  weight?: number; // optional server-provided weight for probability transparency
}

export interface ApiCase {
  id: number;
  name: string;
  price: number; // spin cost / open cost
  image?: string;
  isActive: boolean;
  prizes: ApiCasePrizeRef[]; // flat prize list (simplified for client)
  updatedAt?: number;
}

// Banner (homepage / promo)
export interface ApiBanner {
  id: number;
  title: string;
  image: string;
  link?: string;
  priority: number;
  startsAt?: number; // epoch ms
  endsAt?: number;   // epoch ms
  isActive: boolean;
}

// Product (store / boosters / subscriptions)
export interface ApiProduct {
  id: string | number;
  sku: string;               // stable identifier
  name: string;
  description?: string;
  image: string;
  price: number;             // base price in USDT
  currency: 'USDT';
  category?: string;         // e.g. 'boost', 'cosmetic'
  benefits?: Record<string, unknown>; // backend-defined structured benefits
  isActive: boolean;
  updatedAt?: number;
}

export interface ApiDeposit {
  id: string;
  amount: number;
  currency: 'USDT';
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: number;
  updatedAt: number;
  txHash?: string; // optional blockchain / payment tx id
}

export interface CreateDepositRequest {
  amount: number;
  currency: 'USDT';
  clientDepositId?: string; // client-generated idempotency key
}

export interface SpinRequestDto {
  caseId: string | number;
  mode?: 'normal' | 'preview'; // preview might not mutate balance
  requestId?: string; // idempotency / correlation
}

// Helper generic for paginated responses if needed later
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}