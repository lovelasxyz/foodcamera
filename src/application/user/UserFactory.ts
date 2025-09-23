import { User, UserStatus } from '@/types/user';
import { ASSETS } from '@/constants/assets';
import { ParsedTelegramUser } from '@/types/telegram';

const baseDefaults = () => ({
  avatar: ASSETS.IMAGES.AVATAR,
  balance: 100,
  wallet: undefined as string | undefined,
  status: 'regular' as UserStatus,
  isAdmin: false,
  perks: { freeSpins: false, unlimitedBalance: false } as User['perks'],
  telegram: undefined as User['telegram'],
  stats: { spinsCount: 0, lastAuthAt: null } as User['stats'],
  inventory: [] as User['inventory'],
  shards: {} as NonNullable<User['shards']>,
  shardUpdatedAt: {} as NonNullable<User['shardUpdatedAt']>,
  lastDrop: null as User['lastDrop']
});

export const UserFactory = {
  createGuest(): User {
    return {
      id: 'guest',
      name: 'Guest User',
      ...baseDefaults(),
    };
  },

  createFromTelegram(t: ParsedTelegramUser): User {
    const defaults = baseDefaults();
    const avatar = t.avatar && t.avatar.trim().length > 0 ? t.avatar : defaults.avatar;
    const hasPhoto = !!t.avatar && t.avatar.trim().length > 0;
    return {
      id: t.id,
      name: t.name,
      ...defaults,
      avatar,
      status: t.isPremium ? 'premium' : 'regular',
      telegram: {
        id: t.id,
        username: t.username,
        registeredAt: Date.now(),
        hasPhoto,
        photoUrl: hasPhoto ? t.avatar : undefined,
      },
      stats: { spinsCount: 0, lastAuthAt: Date.now() }
    };
  },
};
