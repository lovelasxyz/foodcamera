import { ApiProduct } from '@/types/api';

// Domain model (reuse existing Prize-like shape or define explicit Product)
export interface ProductDomainModel {
  id: string | number;
  sku: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  currency: 'USDT';
  category?: string;
  benefits?: Record<string, unknown>;
  isActive: boolean;
  updatedAt?: number;
}

export function mapApiProduct(api: ApiProduct): ProductDomainModel {
  return { ...api };
}
