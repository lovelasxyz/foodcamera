import React, { useMemo, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import styles from './ProfilePage.module.css';
import { SHARD_PRODUCTS } from '@/utils/constants';
import { Modal } from '@/components/ui/Modal';
import { DepositModal } from '@/components/profile/DepositModal';
import { PrizeItem } from '@/domain/items/PrizeItem';
import { ASSETS } from '@/constants/assets';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';

export const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const { user, disconnectWallet, craftFromShards, sellInventoryItem, receiveInventoryItem } = useUserStore();
  const { setActivePage, isModalOpen, modalType, openModal, closeModal } = useUIStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedShardKey, setSelectedShardKey] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(true);
  const isOnline = useOnlineStatus();
  const [hideInventoryError, setHideInventoryError] = useState<boolean>(false);
  const [inventoryOfflinePhase, setInventoryOfflinePhase] = useState<'idle' | 'loading' | 'error'>('idle');

  // Управляем показом: при офлайне сначала короткий прелоадер, затем ошибка
  React.useEffect(() => {
    if (!isOnline) {
      setInventoryOfflinePhase('loading');
      const t = setTimeout(() => setInventoryOfflinePhase('error'), 800);
      return () => clearTimeout(t);
    }
    // Вернулись онлайн — сброс
    setHideInventoryError(false);
    setInventoryOfflinePhase('idle');
  }, [isOnline]);
  const selectedInventoryItem = useMemo(() => user.inventory.find(i => i.id === selectedItemId) || null, [user.inventory, selectedItemId]);

  // Единая лента карточек: полноценные предметы + осколки, отсортированные по дате получения/обновления
  const combinedInventory = useMemo(() => {
    // Карточки предметов с временем получения
    const items = user.inventory.map((inv) => {
      const dto = new PrizeItem(inv.prize);
      return {
        kind: 'item' as const,
        id: inv.id,
        image: dto.data.image,
        price: dto.price,
        item: inv,
        updatedAt: inv.obtainedAt || 0
      };
    });
    // Карточки осколков с последним временем изменения количества
    const shards = Object.entries(user.shards || {}).map(([key, count]) => {
      const cfg = SHARD_PRODUCTS[key as keyof typeof SHARD_PRODUCTS];
      return {
        kind: 'shard' as const,
        id: `shard-${key}`,
        image: cfg?.shardImage || '/images/gift_shard.png',
        label: `${count} of ${cfg?.required ?? 10}`,
        shardKey: key,
        count,
        required: cfg?.required ?? 10,
        rarity: 'common' as const,
        updatedAt: (user as any).shardUpdatedAt?.[key] || 0
      };
    });
    // Сортируем по updatedAt по убыванию, чтобы новые всегда сверху
    const combined = [...items, ...shards].sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return combined;
  }, [user.inventory, user.shards, (user as any).shardUpdatedAt]);

  // Отфильтрованный список с учетом режима отображения
  const visibleInventory = useMemo(() => {
    const base = combinedInventory;
    if (!showOnlyAvailable) return base;
    return base.filter((card: any) => {
      // В режиме available показываем активные предметы и осколки
      if (card.kind === 'item') {
        return card.item?.status === 'active';
      }
      // Осколки считаем доступными
      return true;
    });
  }, [combinedInventory, showOnlyAvailable]);

  return (
    <div className={styles.profileContainer}>
    <div className={styles.profilePage}>
      {/* User Profile Section */}
      <div className={styles.userProfile}>
        <div className={styles.profileInfo}>
        <div className={styles.avatars}>
          <img 
            src={user.avatar} 
            alt="User avatar" 
            className={styles.profileAvatar} 
          /> </div> 
          <div className={styles.profileDetails}>
            <div className={styles.profileName}>{user.name}</div>
            <div className={styles.profileId}>#{user.id}</div>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className={styles.balanceContainer}>
        <div className={styles.balanceInfo}>
          <div className={styles.balanceLabel}>{t('common.balance')}</div>
          <div className={styles.balanceValue}>
            {user.balance.toFixed(2)}
            
             <img 
                      src={ASSETS.IMAGES.TON} 
                      alt="TON" 
                      style={{ width: '20px', height: '20px' }}
             />
          </div>
        </div>
        <Button className={styles.depositButton} onClick={() => openModal('deposit')}>
          {t('common.deposit')}
        </Button>
      </div>

      {/* Wallet Section */}
      <div className={styles.walletContainer}>
        <div className={styles.walletInfo}>
          <div className={styles.walletLabel}>{t('common.connectedWallet')}</div>
          <div className={styles.walletAddress}>
            {user.wallet ? user.wallet : 'UQDKd...hxwP'}
          </div>
        </div>
        <Button 
          className={styles.disconnectButton}
          onClick={disconnectWallet}
        >
          {t('common.disconnect')}
        </Button>
      </div>

      {/* Deposit Modal */}
      <DepositModal isOpen={isModalOpen && modalType === 'deposit'} onClose={closeModal} />

      {/* Invite Friends Section */}
      <div className={styles.inviteContainer}>
        <img
          src={ASSETS.IMAGES.LIGHTNING_PNG}
          alt="Decorative lightning"
          className={styles.inviteLightning}
        />
        <div className={styles.inviteContent}>
        <img 
                src={ASSETS.ICONS.INVITE} 
                style={{ width: '35px', height: '35px' }}
              />
          <div className={styles.inviteText}>{t('common.inviteTitle')}</div>
        </div>
        <Button className={styles.inviteButton}>
          {t('common.inviteCta')}
        </Button>
      </div>

      {/* Inventory Section */}
      <div className={styles.inventoryContainer}>
        <div className={styles.inventoryHeader}>
          <div className={styles.inventoryLabel}>{t('common.inventory')}</div>
          <Button className={styles.inventoryButton} onClick={() => setShowOnlyAvailable((v) => !v)}>
            {showOnlyAvailable ? t('common.showAll') : t('common.showAvailable')}
          </Button>
        </div>
        
        <div className={styles.inventorySection}>
          {inventoryOfflinePhase === 'loading' && (
            <div className={styles.inventoryLoadingContainer}>
              <div className={styles.inventoryLoadingSpinner}></div>
              <div className={styles.inventoryLoadingText}>{t('common.loadingInventory')}</div>
            </div>
          )}
          {inventoryOfflinePhase === 'error' && (
            <div className={styles.errorWrapper}>
              {!hideInventoryError && (
                <div className={styles.errorMessageContainer}>
                  <div className={styles.errorMessageContent}>{t('common.offlineFeatures')}</div>
                  <button className={styles.errorClose} onClick={() => setHideInventoryError(true)}>×</button>
                </div>
              )}
              <div className={styles.errorState}>
                <div className={styles.errorMessage}>{t('common.failedToLoad')}</div>
                <button className={styles.retryButton} onClick={() => window.location.reload()}>
                  <div className={styles.buttonLabel}>{t('common.tryAgain')}</div>
                </button>
              </div>
            </div>
          )}
          {inventoryOfflinePhase === 'idle' && combinedInventory.length === 0 ? (
            <div className={styles.emptyInventory}>
              <p className={styles.titleInventory}>{t('common.emptyNoCases')}</p>
              <Button className={styles.openCasesButton} onClick={() => setActivePage('main')}>
                {t('common.emptyOpenCases')}
              </Button>
            </div>
          ) : inventoryOfflinePhase === 'idle' ? (
            <>
              {/* Прогресс осколков */}
              <div className={styles.inventoryGrid}>
                {visibleInventory.map((card) => {
                  if (card.kind === 'item') {
                    const isSold = card.item.status === 'sold';
                    const isActive = card.item.status === 'active';
                    const statusLabel = isSold ? t('common.sold') : isActive ? t('common.active') : t('common.received');
                    return (
                      <div 
                        key={card.id} 
                        className={`${styles.inventoryItem} ${isSold ? styles.itemDisabled : ''}`} 
                        data-rarity={(card.item.prize?.rarity) as any}
                        onClick={() => { if (!isSold) setSelectedItemId(card.id); }} 
                        style={{ cursor: isSold ? 'not-allowed' : 'pointer' }}
                      >
                        <img src={card.image} alt="item" className={styles.itemImage} />
                        <div className={`${styles.hint} ${styles.prizeHint}`}>
                          <div className={styles.coinWrapper}>
                            <div className={`${styles.coin} ${styles.small}`}>
                              <img className={styles.coinImage} src={ASSETS.IMAGES.TON} alt="Coin" />
                            </div>
                          </div>
                          <div className={styles.price}>{card.price.toFixed(2)}</div>
                        </div>
                        <div className={`${styles.statusBadge} ${isSold ? styles.statusSold : (isActive ? styles.statusActive : styles.statusReceived)}`}>
                          {statusLabel}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={card.id} className={styles.inventoryItem} onClick={() => setSelectedShardKey(card.shardKey)} style={{ cursor: 'pointer' }}>
                      <img src={card.image} alt="shard" className={styles.itemImage} />
                      <div className={styles.shardBadge}>
                        {t('common.ofPattern', { count: card.count, total: card.required })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Modal: Shard crafting */}
      <Modal
        isOpen={!!selectedShardKey}
        onClose={() => setSelectedShardKey(null)}
        title={t('modal.craftTitle')}
        size="md"
      >
        {selectedShardKey && (
          <div style={{ width: '100%' }}>
            {(() => {
              const key = selectedShardKey;
              const cfg = SHARD_PRODUCTS[key as keyof typeof SHARD_PRODUCTS];
              const count = user.shards?.[key] || 0;
              const canCraft = !!cfg && count >= cfg.required;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <img src={cfg?.shardImage || ASSETS.SHARDS.GIFT_SHARD} alt={`${key} shard`} style={{ width: 160, height: 160, objectFit: 'contain' }} />
                  <div style={{ fontWeight: 700 }}>{count}/{cfg?.required ?? 10}</div>
                  <Button className={styles.inventoryButton} onClick={() => { if (canCraft) { craftFromShards(key, 'Craft'); setSelectedShardKey(null); } }}>
                    {canCraft ? t('modal.craft') : t('modal.needMoreShards')}
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Modal: Inventory item actions */}
      <Modal
        isOpen={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        title={selectedInventoryItem?.prize.name}
        size="md"
      >
        {selectedInventoryItem && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={selectedInventoryItem.prize.image} alt={selectedInventoryItem.prize.name} style={{ width: 220, height: 220, objectFit: 'contain' }} />
              </div>
              {!!selectedInventoryItem.prize.description && (
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.4 }}>
                  {selectedInventoryItem.prize.description}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ color: '#9CA3AF' }}>{t('common.model')}</div>
                <div style={{ textAlign: 'right' }}>{t('common.basic100')}</div>
                <div style={{ color: '#9CA3AF' }}>{t('common.symbol')}</div>
                <div style={{ textAlign: 'right' }}>Default</div>
                <div style={{ color: '#9CA3AF' }}>{t('common.backdrop')}</div>
                <div style={{ textAlign: 'right' }}>—</div>
                <div style={{ color: '#9CA3AF' }}>{t('common.mintable')}</div>
                <div style={{ textAlign: 'right' }}>{t('common.yes')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button className={styles.inventoryButton} onClick={() => { sellInventoryItem(selectedInventoryItem.id); setSelectedItemId(null); }}>
                  {t('common.sell')} ({selectedInventoryItem.prize.price.toFixed(2)})
                </Button>
                <Button className={styles.inventoryButton} onClick={() => { receiveInventoryItem(selectedInventoryItem.id); window.open('https://t.me/BotFather', '_blank'); }}>
                  {t('common.receive')}
                </Button>
                <Button className={styles.inventoryButton} onClick={() => setSelectedItemId(null)}>
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div></div>
  );
}; 