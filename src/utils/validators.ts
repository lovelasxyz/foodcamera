// Функции валидации

/**
 * Проверяет, является ли email валидным
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Проверяет, является ли URL валидным
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Проверяет, является ли число положительным
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Проверяет, достаточно ли средств для операции
 */
export const hasSufficientBalance = (balance: number, required: number): boolean => {
  return isPositiveNumber(balance) && balance >= required;
};

/**
 * Проверяет, является ли строка валидным адресом кошелька TON
 */
export const isValidTonAddress = (address: string): boolean => {
  // Упрощенная проверка для TON адреса
  const tonAddressRegex = /^[UE][Qf][A-Za-z0-9\-_]{46}$/;
  return tonAddressRegex.test(address);
};

/**
 * Проверяет, является ли значение валидным ID
 */
export const isValidId = (id: any): boolean => {
  return (typeof id === 'string' || typeof id === 'number') && 
         id !== null && 
         id !== undefined && 
         String(id).trim() !== '';
};

/**
 * Проверяет, находится ли число в заданном диапазоне
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return typeof value === 'number' && value >= min && value <= max;
};

/**
 * Проверяет, является ли строка не пустой
 */
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Проверяет, является ли массив не пустым
 */
export const isNonEmptyArray = (value: any): value is any[] => {
  return Array.isArray(value) && value.length > 0;
}; 