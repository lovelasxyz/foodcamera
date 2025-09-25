import { apiClient } from '@/services/apiClient';
import { API_CONFIG } from '@/config/api.config';
import { ApiProduct } from '@/types/api';
import { IProductRepository } from '@/application/product/IProductRepository';
import { ProductMapper } from '@/domain/product/ProductMapper';
import type { ProductProps } from '@/domain/product/Product';

export class ProductRepository implements IProductRepository {
  async fetchAll(): Promise<ProductProps[]> {
    const data = await apiClient.get<ApiProduct[]>(API_CONFIG.ENDPOINTS.PRODUCTS);
    return data.map(d => ProductMapper.toDomain({
      id: d.id,
      name: d.name,
      price: d.price,
      image: d.image,
      rarity: 'common', // fallback until backend sends proper rarity
      benefit: undefined,
      uniqueKey: undefined,
      stackable: false,
      notAwardIfOwned: false,
      nonRemovableGift: false
    }));
  }
}
