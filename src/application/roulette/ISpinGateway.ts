export interface SpinRequestItem {
  id: number;
  ev: number; // Expected value (price) of the prize
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  benefitType?: 'discount' | 'subscription' | 'lottery_ticket' | 'bigwin';
}

export interface SpinRequest {
  caseId: number;
  userId?: string;
  items: SpinRequestItem[];
}

export interface SpinResponse {
  prizeId: number; // id of selected prize
  // optional enriched server authoritative prize payload
  serverPrize?: {
    id: number;
    name?: string;
    price?: number;
    rarity?: string;
    image?: string;
  };
  position?: number; // server-provided wheel position (if any)
  raw?: unknown; // debugging / future use
  spinId?: string;
  userPatch?: { balance?: number; stats?: { spinsCount?: number }; [k: string]: unknown };
}

/**
 * Abstraction over backend Spin API. Implementations may call HTTP or return mock results.
 */
export interface ISpinGateway {
  requestSpin(payload: SpinRequest): Promise<SpinResponse>;
}
