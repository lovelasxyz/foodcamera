import React from 'react';
import styles from '../ProfilePage.module.css';
import { InventoryGrid } from '@/components/widgets/InventoryGrid/InventoryGrid';
import { Button } from '@/components/ui/Button';
import { ASSETS } from '@/constants/assets';
import { PrizeItem } from '@/domain/items/PrizeItem';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

interface InventoryItemDTO {
  kind: 'item' | 'shard';
  id: string;
  image: string;
  price?: number;
  item?: any;
  shardKey?: string;
  count?: number;
  required?: number;
  updatedAt?: number;
}

interface InventorySectionProps {
  combined: InventoryItemDTO[];
  visible: InventoryItemDTO[];
  isOnline: boolean;
  isLoading: boolean;
  inventoryFetched?: boolean;
  showOnlyAvailable?: boolean;
  setShowOnlyAvailable: (v: boolean) => void;
  onSelectItem: (id: string) => void;
  onSelectShard: (key: string) => void;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  combined,
  visible,
  isOnline,
  isLoading,
  inventoryFetched,
  showOnlyAvailable = false,
  setShowOnlyAvailable,
  onSelectItem,
  onSelectShard
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.inventoryHeader}>
        <div className={styles.inventoryLabel}>{t('common.inventory')}</div>
        <Button className={styles.inventoryButton} onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}>
          {showOnlyAvailable ? t('common.showAll') : t('common.showAvailable')}
        </Button>
      </div>
      <div className={styles.inventorySection}>
        <InventoryGrid
          loading={isLoading && isOnline}
          empty={!!inventoryFetched && combined.length === 0}
          renderEmpty={() => (
            <div className={styles.emptyInventory}>
              <p className={styles.titleInventory}>{t('common.emptyNoCases')}</p>
              <Button className={styles.openCasesButton} onClick={() => navigate(ROUTES.home)}>
                {t('common.emptyOpenCases')}
              </Button>
            </div>
          )}
          renderContent={() => (
            <div className={styles.inventoryGrid}>
              {visible.map((card) => {
                if (card.kind === 'item' && card.item) {
                  const isSold = card.item.status === 'sold';
                  const isActive = card.item.status === 'active';
                  const isDisabled = !isActive;
                  const dto = new PrizeItem(card.item.prize);
                  const price = dto.price.toFixed(2);
                  const statusLabel = isSold ? t('common.sold') : isActive ? t('common.active') : t('common.received');
                  return (
                    <div
                      key={card.id}
                      className={`${styles.inventoryItem} ${isDisabled ? '' : ''}`}
                      data-rarity={(card.item.prize?.rarity) as any}
                      onClick={() => { if (isActive) onSelectItem(card.id); }}
                      style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ProgressiveImg
                        src={card.image}
                        previewSrc={card.item.prize?.previewImage}
                        cacheKey={card.id}
                        lazy={true}
                        alt="item"
                        className={styles.itemImage}
                      />
                      </div>
                      <div className={`${styles.hint} ${styles.prizeHint}`}>
                        <div className={styles.coinWrapper}>
                          <div className={`${styles.coin} ${styles.small}`}>
                            <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                          </div>
                        </div>
                        <div className={styles.price}>{price}</div>
                      </div>
                      <div className={`${styles.statusBadge} ${isSold ? styles.statusSold : (isActive ? styles.statusActive : styles.statusReceived)}`}>
                        {statusLabel}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={card.id} className={styles.inventoryItem} onClick={() => card.shardKey && onSelectShard(card.shardKey)} style={{ cursor: 'pointer' }}>
                    <img src={card.image} alt="shard" className={styles.itemImage} />
                    <div className={styles.shardBadge}>
                      {t('common.ofPattern', { count: card.count, total: card.required })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
};


