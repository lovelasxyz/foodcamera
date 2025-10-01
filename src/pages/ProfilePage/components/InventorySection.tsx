import React from 'react';
import styles from '../ProfilePage.module.css';
import { InventoryGrid } from '@/components/widgets/InventoryGrid/InventoryGrid';
import { Button } from '@/components/ui/Button';
import { ASSETS } from '@/constants/assets';
import { PrizeItem } from '@/domain/items/PrizeItem';
import { LazyImage } from '@/components/ui/LazyImage';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

interface InventoryItemDTO {
  kind: 'item' | 'shard' | 'stackable';
  id: string;
  image: string;
  price?: number;
  item?: any;
  shardKey?: string;
  count?: number;
  required?: number;
  updatedAt?: number;
  benefitType?: string;
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
  // Persisted toggle key
  const TOGGLE_KEY = 'inv_show_available_v1';

  // On mount sync initial toggle if parent passed default (parent owns state) – here only side-effect if storage differs
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TOGGLE_KEY);
      if (stored != null) {
        const parsed = stored === '1';
        if (parsed !== showOnlyAvailable) {
          setShowOnlyAvailable(parsed);
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes
  React.useEffect(() => {
    try {
      window.localStorage.setItem(TOGGLE_KEY, showOnlyAvailable ? '1' : '0');
    } catch { /* ignore */ }
  }, [showOnlyAvailable]);

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.inventoryHeader}>
        <div className={styles.inventoryLabel}>
          {t('common.inventory')} <span style={{ opacity: 0.65, fontWeight: 500 }}>({combined.length})</span>
        </div>
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
          renderContent={() => {
            // Renderer for each inventory card
            const cellRenderer = (card: InventoryItemDTO) => {
                // Stackable prizes (weekly_ticket, permanent_token)
                if (card.kind === 'stackable') {
                  return (
                    <div
                      key={card.id}
                      className={styles.inventoryItem}
                      data-rarity={(card.item.prize?.rarity) as any}
                      onClick={() => onSelectItem(card.item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LazyImage
                          src={card.image}
                          alt="item"
                          className={styles.itemImage}
                          rootMargin="400px"
                        />
                      </div>
                      <div className={styles.shardBadge}>
                        {card.count}
                      </div>
                    </div>
                  );
                }

                // Regular prizes
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
                        <LazyImage
                          src={card.image}
                          alt="item"
                          className={styles.itemImage}
                          rootMargin="400px"
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

                // Shards (for crafting)
                return (
                  <div key={card.id} className={styles.inventoryItem} onClick={() => card.shardKey && onSelectShard(card.shardKey)} style={{ cursor: 'pointer' }}>
                    <LazyImage
                      src={card.image}
                      alt="shard"
                      className={styles.itemImage}
                      rootMargin="400px"
                    />
                    <div className={styles.shardBadge}>
                      {t('common.ofPattern', { count: card.count, total: card.required })}
                    </div>
                  </div>
                );
            };

            // Regular grid with LazyImage for memory efficiency
            return (
              <div className={styles.inventoryGrid}>
                {visible.map(card => cellRenderer(card))}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};


