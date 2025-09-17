import React from 'react';
import styles from '../ProfilePage.module.css';
import { SHARD_PRODUCTS } from '@/utils/constants';
import { ASSETS } from '@/constants/assets';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/i18n';

interface ShardProgressProps {
  selectedShardKey: string | null;
  setSelectedShardKey: (key: string | null) => void;
  shards: Record<string, number>;
  onCraft: (key: string) => void;
}

export const ShardProgress: React.FC<ShardProgressProps> = ({ selectedShardKey, setSelectedShardKey, shards, onCraft }) => {
  const { t } = useI18n();
  if (!selectedShardKey) return null;
  const key = selectedShardKey;
  const cfg = SHARD_PRODUCTS[key as keyof typeof SHARD_PRODUCTS];
  const count = shards?.[key] || 0;
  const canCraft = !!cfg && count >= cfg.required;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <img src={cfg?.shardImage || ASSETS.SHARDS.GIFT_SHARD} alt={`${key} shard`} style={{ width: 160, height: 160, objectFit: 'contain' }} />
        <div style={{ fontWeight: 700 }}>{count}/{cfg?.required ?? 10}</div>
        <Button className={styles.inventoryButton} onClick={() => { if (canCraft) { onCraft(key); setSelectedShardKey(null); } }}>
          {canCraft ? t('modal.craft') : t('modal.needMoreShards')}
        </Button>
      </div>
    </div>
  );
};




