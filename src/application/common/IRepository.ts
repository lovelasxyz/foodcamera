export interface IRepository<T, TId = string | number> {
  fetchAll(): Promise<T[]>;
  fetchById?(id: TId): Promise<T | null>;
  create?(item: T): Promise<T>;
  update?(id: TId, item: Partial<T>): Promise<T>;
  delete?(id: TId): Promise<void>;
}


