import { ParsedTelegramUser, TelegramWebApp, TelegramWebAppUser } from '@/types/telegram';
import { ASSETS } from '@/constants/assets';

class TelegramAuthService {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    this.webApp = window.Telegram?.WebApp || null;
  }

  /**
   * Проверяет доступность Telegram WebApp
   */
  isAvailable(): boolean {
    return !!this.webApp;
  }

  /**
   * Получает данные пользователя из Telegram WebApp
   */
  getTelegramUser(): TelegramWebAppUser | null {
    if (!this.webApp) {
      console.warn('Telegram WebApp is not available');
      return null;
    }

    if (!this.webApp.initDataUnsafe?.user) {
      console.warn('No user data in initDataUnsafe');
      return null;
    }

    const user = this.webApp.initDataUnsafe.user;
    
    // Проверяем минимальную валидность данных пользователя
    if (!user.id || !user.first_name) {
      console.warn('Invalid user data:', user);
      return null;
    }

    return user;
  }

  /**
   * Получает авторизационные данные из Telegram
   */
  getInitData(): string {
    return this.webApp?.initData || '';
  }

  /**
   * Парсит данные пользователя в формат приложения
   */
  parseUserData(telegramUser: TelegramWebAppUser): ParsedTelegramUser {
    const fullName = [telegramUser.first_name, telegramUser.last_name]
      .filter(Boolean)
      .join(' ');

    return {
      id: telegramUser.id.toString(),
      name: fullName || telegramUser.username || 'User',
      username: telegramUser.username,
      avatar: telegramUser.photo_url,
      isPremium: telegramUser.is_premium,
      languageCode: telegramUser.language_code,
    };
  }

  /**
   * Получает URL аватарки пользователя с максимальным качеством
   */
  getAvatarUrl(telegramUser: TelegramWebAppUser): string {
    if (telegramUser.photo_url) {
      // Telegram WebApp может возвращать URL в разных форматах
      // Пытаемся получить максимальное качество
      const url = telegramUser.photo_url;
      if (url.includes('_640')) {
        return url.replace('_640', '_640'); // Уже максимальное качество
      }
      return url.replace(/(_\d+)?\.jpg$/, '_640.jpg');
    }
    
    // Возвращаем дефолтную аватарку
    return ASSETS.IMAGES.AVATAR;
  }

  /**
   * Создает дефолтную аватарку на основе имени пользователя
   */
  generateDefaultAvatar(name: string): string {
    // Генерируем аватарку с инициалами (можно использовать сервис типа UI Avatars)
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colors = ['667eea', '764ba2', 'f093fb', 'f5576c', '4facfe', '00f2fe'];
    const colorIndex = name.length % colors.length;
    const color = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=ffffff&size=200&font-size=0.6`;
  }

  /**
   * Выполняет автоматическую авторизацию
   */
  async authenticate(): Promise<ParsedTelegramUser | null> {
    if (!this.isAvailable()) {
      console.warn('Telegram WebApp is not available');
      return null;
    }

    const telegramUser = this.getTelegramUser();
    if (!telegramUser) {
      console.warn('No user data available from Telegram WebApp');
      return null;
    }

    const parsedUser = this.parseUserData(telegramUser);
    
    // Получаем аватарку
    if (telegramUser.photo_url) {
      parsedUser.avatar = this.getAvatarUrl(telegramUser);
    } else {
      parsedUser.avatar = this.generateDefaultAvatar(parsedUser.name);
    }

    return parsedUser;
  }

  /**
   * Получает платформу пользователя
   */
  getPlatform(): string {
    return this.webApp?.platform || 'unknown';
  }

  /**
   * Получает версию Telegram WebApp
   */
  getVersion(): string {
    return this.webApp?.version || 'unknown';
  }

  /**
   * Получает цветовую схему
   */
  getColorScheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark';
  }

  /**
   * Проверяет, является ли пользователь премиум
   */
  isPremiumUser(): boolean {
    const user = this.getTelegramUser();
    return user?.is_premium || false;
  }

  /**
   * Отправляет тактильную обратную связь
   */
  sendHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light'): void {
    if (!this.webApp?.HapticFeedback) return;

    switch (type) {
      case 'success':
        this.webApp.HapticFeedback.notificationOccurred('success');
        break;
      case 'error':
        this.webApp.HapticFeedback.notificationOccurred('error');
        break;
      case 'warning':
        this.webApp.HapticFeedback.notificationOccurred('warning');
        break;
      default:
        this.webApp.HapticFeedback.impactOccurred(type);
    }
  }

  /**
   * Показывает уведомление пользователю
   */
  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.webApp?.showAlert) {
        this.webApp.showAlert(message, () => resolve());
      } else {
        alert(message);
        resolve();
      }
    });
  }

  /**
   * Показывает подтверждение пользователю
   */
  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.webApp?.showConfirm) {
        this.webApp.showConfirm(message, (confirmed) => resolve(confirmed));
      } else {
        resolve(confirm(message));
      }
    });
  }
}

// Экспортируем синглтон
export const telegramAuth = new TelegramAuthService(); 