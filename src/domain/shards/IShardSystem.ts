import { Prize } from '@/types/game';

export interface ShardProgress {
  key: string;
  count: number;
  required: number;
}

export interface IShardSystem {
  addShard(shards: Record<string, number>, key: string, count: number): Record<string, number>;
  canCraft(shards: Record<string, number>, key: string): boolean;
  craft(
    shards: Record<string, number>,
    shardUpdatedAt: Record<string, number>,
    key: string
  ): { updatedShards: Record<string, number>; updatedShardUpdatedAt: Record<string, number>; prize: Prize } | null;
  getProgress(shards: Record<string, number>, key: string): ShardProgress;
}


