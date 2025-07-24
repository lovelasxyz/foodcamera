// Утилиты для форматирования данных

/**
 * Форматирует число как валюту
 */
export const formatCurrency = (amount: number, symbol = 'T'): string => {
  return `${amount.toFixed(2)} ${symbol}`;
};

/**
 * Форматирует большие числа с сокращениями (K, M, B)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Форматирует дату в читаемый формат
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Форматирует время относительно текущего момента
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}д назад`;
  if (hours > 0) return `${hours}ч назад`;
  if (minutes > 0) return `${minutes}м назад`;
  return 'Только что';
};

/**
 * Обрезает текст до указанной длины
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Форматирует адрес кошелька для отображения
 */
export const formatWalletAddress = (address: string): string => {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}; 