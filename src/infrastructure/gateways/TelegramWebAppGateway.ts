import { ITelegramWebAppGateway, HapticFeedbackType } from '@/application/telegram/ITelegramWebAppGateway';
import { ParsedTelegramUser, TelegramWebApp, TelegramWebAppUser } from '@/types/telegram';
import { ASSETS } from '@/constants/assets';
import { logDebug } from '@/services/logger';

const isDev = () => (import.meta as any)?.env?.DEV || process.env.NODE_ENV === 'development';

export class TelegramWebAppGateway implements ITelegramWebAppGateway {
  private cachedWebApp: TelegramWebApp | null = null;

  private resolveWebApp(): TelegramWebApp | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const next = window.Telegram?.WebApp || null;
    if (next) {
      this.cachedWebApp = next;
    }
    return this.cachedWebApp;
  }

  private get webApp(): TelegramWebApp | null {
    return this.resolveWebApp();
  }

  isAvailable(): boolean {
    const webApp = this.resolveWebApp();
    if (!webApp) {
      return false;
    }

    const hasInitData = Boolean(webApp.initData) || Boolean(webApp.initDataUnsafe?.user);
    if (hasInitData) {
      return true;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const hasLaunchParams = params.has('tgWebAppPlatform') || params.has('tgWebAppVersion');

    if (!hasLaunchParams) {
      if (isDev()) {
        logDebug('Telegram WebApp detected but no init data, assuming external browser');
      }
      return false;
    }

    if (isDev()) {
      logDebug('Telegram WebApp init data pending – launch params detected, waiting for ready state');
    }
    return true;
  }

  getInitData(): string {
    return this.webApp?.initData || '';
  }

  getTelegramUser(): TelegramWebAppUser | null {
    const webApp = this.webApp;
    if (!webApp) {
      if (isDev()) logDebug('Telegram WebApp is not available');
      return null;
    }

    const rawUser = webApp.initDataUnsafe?.user;
    if (!rawUser) {
      if (isDev()) logDebug('No user data in initDataUnsafe');
      return null;
    }

    if (!rawUser.id || !rawUser.first_name) {
      if (isDev()) logDebug('Invalid user data:', rawUser);
      return null;
    }

    return rawUser;
  }

  private parseUserData(telegramUser: TelegramWebAppUser): ParsedTelegramUser {
    const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ');
    const parsed: ParsedTelegramUser = {
      id: telegramUser.id.toString(),
      name: fullName || telegramUser.username || 'User',
      username: telegramUser.username,
      avatar: telegramUser.photo_url || undefined,
      isPremium: telegramUser.is_premium,
      languageCode: telegramUser.language_code
    };

    if (telegramUser.photo_url) {
      parsed.avatar = this.getAvatarUrl(telegramUser);
    }

    return parsed;
  }

  private getAvatarUrl(user: TelegramWebAppUser): string {
    const url = user.photo_url;
    if (!url) {
      return ASSETS.IMAGES.AVATAR;
    }

    if (url.includes('_640')) {
      return url;
    }
    return url.replace(/(_\d+)?\.jpg$/, '_640.jpg');
  }

  async authenticate(): Promise<ParsedTelegramUser | null> {
    if (!this.isAvailable()) {
      if (isDev()) logDebug('Telegram WebApp is not available');
      return null;
    }

    const telegramUser = this.getTelegramUser();
    if (!telegramUser) {
      if (isDev()) logDebug('No user data available from Telegram WebApp');
      return null;
    }

    return this.parseUserData(telegramUser);
  }

  getPlatform(): string {
    return this.webApp?.platform || 'unknown';
  }

  getVersion(): string {
    return this.webApp?.version || 'unknown';
  }

  getColorScheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark';
  }

  isPremiumUser(): boolean {
    return this.getTelegramUser()?.is_premium || false;
  }

  sendHapticFeedback(type: HapticFeedbackType = 'light'): void {
    const webApp = this.webApp;
    const haptics = webApp?.HapticFeedback;
    if (!haptics) return;

    switch (type) {
      case 'success':
        haptics.notificationOccurred('success');
        break;
      case 'error':
        haptics.notificationOccurred('error');
        break;
      case 'warning':
        haptics.notificationOccurred('warning');
        break;
      default:
        haptics.impactOccurred(type);
    }
  }

  async showAlert(message: string): Promise<void> {
    const webApp = this.webApp;
    if (webApp?.showAlert) {
      return new Promise((resolve) => {
        webApp.showAlert(message, () => resolve());
      });
    }
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    }
  }

  async showConfirm(message: string): Promise<boolean> {
    const webApp = this.webApp;
    if (webApp?.showConfirm) {
      return new Promise((resolve) => {
        webApp.showConfirm(message, (confirmed) => resolve(confirmed));
      });
    }
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return Promise.resolve(window.confirm(message));
    }
    return Promise.resolve(false);
  }
}

export const telegramWebAppGateway = new TelegramWebAppGateway();
