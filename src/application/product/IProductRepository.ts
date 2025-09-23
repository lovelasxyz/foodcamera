import type { ProductProps } from '@/domain/product/Product';

export interface IProductRepository {
  fetchAll(): Promise<ProductProps[]>;
}
