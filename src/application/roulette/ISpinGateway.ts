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
}

/**
 * Abstraction over backend Spin API. Implementations may call HTTP or return mock results.
 */
export interface ISpinGateway {
  requestSpin(payload: SpinRequest): Promise<SpinResponse>;
}
