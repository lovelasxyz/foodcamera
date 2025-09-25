import { User } from '@/types/user';
import { ApiSpinResult, ApiDeposit } from '@/types/api';
import { UserFactory } from '@/application/user/UserFactory';

export const mockUser = (): User => {
  const guest = UserFactory.createGuest();
  return { ...guest, balance: 123, username: 'mock_user' } as User;
};

export const mockSpin = (caseId: string): ApiSpinResult => ({
  spinId: 'spin-mock',
  caseId,
  prize: {
    id: 9999,
    name: 'Mock Prize',
    price: 5,
    image: '/assets/images/placeholder.png',
    rarity: 'common'
  },
  position: 0,
  timestamp: Date.now(),
  balanceDelta: -1, // pretend cost
  userPatch: { balance: 122 } // simple example patch (previous mock balance 123)
});

export const mockDeposit = (amount: number): ApiDeposit => ({
  id: 'dep-mock',
  status: 'confirmed',
  amount,
  currency: 'USDT',
  createdAt: Date.now(),
  updatedAt: Date.now()
});
