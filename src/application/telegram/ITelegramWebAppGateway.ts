import { ParsedTelegramUser, TelegramWebAppUser } from '@/types/telegram';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export interface ITelegramWebAppGateway {
  isAvailable(): boolean;
  getInitData(): string;
  getTelegramUser(): TelegramWebAppUser | null;
  authenticate(): Promise<ParsedTelegramUser | null>;
  getPlatform(): string;
  getVersion(): string;
  getColorScheme(): 'light' | 'dark';
  isPremiumUser(): boolean;
  sendHapticFeedback(type?: HapticFeedbackType): void;
  showAlert(message: string): Promise<void>;
  showConfirm(message: string): Promise<boolean>;
}
