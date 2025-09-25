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
  // Lazy batching: отображаем элементы партиями, чтобы не создавать сразу сотни <img>
  const BATCH_SIZE = 40; // можно подстроить; 40 * 2 строки ~= 80 элементов визуально достаточно
  const [batchCount, setBatchCount] = React.useState(1);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Когда список (visible) меняется (фильтр, поиск и т.п.) — сбрасываем батчи
  React.useEffect(() => {
    setBatchCount(1);
  }, [visible]);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (batchCount * BATCH_SIZE >= visible.length) return; // всё загружено — наблюдатель не нужен

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setBatchCount(c => c + 1);
          break;
        }
      }
    }, { root: null, rootMargin: '300px 0px 300px 0px', threshold: 0 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [batchCount, visible.length]);

  const sliced = React.useMemo(() => visible.slice(0, batchCount * BATCH_SIZE), [visible, batchCount]);

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
            // Убрали виртуализацию: возвращаем постоянную сетку (2 в ряд по CSS)
            const cellRenderer = (card: any) => {
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
            };
            return (
              <>
                <div className={styles.inventoryGrid}>
                  {sliced.map(card => cellRenderer(card))}
                </div>
                {sliced.length < visible.length && (
                  <div
                    ref={sentinelRef}
                    style={{ width: '100%', height: 1, opacity: 0 }}
                    aria-hidden="true"
                  />
                )}
              </>
            );
          }}
        />
      </div>
    </div>
  );
};


