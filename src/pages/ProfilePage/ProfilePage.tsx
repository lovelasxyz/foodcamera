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

export const ProfilePage: React.FC = () => {
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

  // Единая лента карточек: полноценные предметы + осколки вперемешку
  const combinedInventory = useMemo(() => {
    const items = user.inventory.map((inv) => {
      const dto = new PrizeItem(inv.prize);
      return {
        kind: 'item' as const,
        id: inv.id,
        image: dto.data.image,
        price: dto.price,
        item: inv
      };
    });
    const shards = Object.entries(user.shards || {}).map(([key, count]) => {
      const cfg = SHARD_PRODUCTS[key as keyof typeof SHARD_PRODUCTS];
      return {
        kind: 'shard' as const,
        id: `shard-${key}`,
        image: cfg?.shardImage || '/images/gift_shard.png',
        label: `${count}/${cfg?.required ?? 10}`,
        shardKey: key,
        count,
        required: cfg?.required ?? 10,
        rarity: 'common' as const
      };
    });
    // Базовый порядок: полноценные предметы, затем осколки
    const combined = [...items, ...shards];
    // Если есть последний дроп — переместим его карточку в начало
    const last = user.lastDrop;
    if (last) {
      const matchIndex = combined.findIndex((card: any) =>
        last.kind === 'item'
          ? (card.kind === 'item' && card.id === last.id)
          : (card.kind === 'shard' && card.shardKey === last.id)
      );
      if (matchIndex > 0) {
        const [match] = combined.splice(matchIndex, 1);
        combined.unshift(match);
      }
    }
    return combined;
  }, [user.inventory, user.shards, user.lastDrop]);

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
    <div className={styles.profilePage}>
      {/* User Profile Section */}
      <div className={styles.userProfile}>
        <div className={styles.profileInfo}>
          <img 
            src={user.avatar} 
            alt="User avatar" 
            className={styles.profileAvatar} 
          />
          <div className={styles.profileDetails}>
            <div className={styles.profileName}>{user.name}</div>
            <div className={styles.profileId}>#{user.id}</div>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className={styles.balanceContainer}>
        <div className={styles.balanceInfo}>
          <div className={styles.balanceLabel}>Balance</div>
          <div className={styles.balanceValue}>
            {user.balance.toFixed(2)}
            
             <img 
                      src={ASSETS.IMAGES.TON} 
                      alt="TON" 
                      style={{ width: '25px', height: '25px' }}
             />
          </div>
        </div>
        <Button className={styles.depositButton} onClick={() => openModal('deposit')}>
          Deposit
        </Button>
      </div>

      {/* Wallet Section */}
      <div className={styles.walletContainer}>
        <div className={styles.walletInfo}>
          <div className={styles.walletLabel}>Connected wallet:</div>
          <div className={styles.walletAddress}>
            {user.wallet ? user.wallet : 'UQDKd...hxwP'}
          </div>
        </div>
        <Button 
          className={styles.disconnectButton}
          onClick={disconnectWallet}
        >
          Disconnect
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
          <div className={styles.inviteText}>Invite Friends</div>
        </div>
        <Button className={styles.inviteButton}>
          Invite
        </Button>
      </div>

      {/* Inventory Section */}
      <div className={styles.inventoryContainer}>
        <div className={styles.inventoryHeader}>
          <div className={styles.inventoryLabel}>Inventory:</div>
          <Button className={styles.inventoryButton} onClick={() => setShowOnlyAvailable((v) => !v)}>
            {showOnlyAvailable ? 'Show all' : 'Show available'}
          </Button>
        </div>
        
        <div className={styles.inventorySection}>
          {inventoryOfflinePhase === 'loading' && (
            <div className={styles.inventoryLoadingContainer}>
              <div className={styles.inventoryLoadingSpinner}></div>
              <div className={styles.inventoryLoadingText}>Loading your inventory...</div>
            </div>
          )}
          {inventoryOfflinePhase === 'error' && (
            <div className={styles.errorWrapper}>
              {!hideInventoryError && (
                <div className={styles.errorMessageContainer}>
                  <div className={styles.errorMessageContent}>You are offline. Some features are disabled.</div>
                  <button className={styles.errorClose} onClick={() => setHideInventoryError(true)}>×</button>
                </div>
              )}
              <div className={styles.errorState}>
                <div className={styles.errorMessage}>Failed to load items. Please try again.</div>
                <button className={styles.retryButton} onClick={() => window.location.reload()}>
                  <div className={styles.buttonLabel}>Try Again</div>
                </button>
              </div>
            </div>
          )}
          {inventoryOfflinePhase === 'idle' && combinedInventory.length === 0 ? (
            <div className={styles.emptyInventory}>
              <p className={styles.titleInventory}>You haven&apos;t opened any cases yet</p>
              <Button className={styles.openCasesButton} onClick={() => setActivePage('main')}>
                Open Cases
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
                    const statusLabel = isSold ? 'Sold' : isActive ? 'Active' : 'Received';
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
                      <div className={styles.shardBadge}>{card.label}</div>
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
        title="Craft item"
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
                    {canCraft ? 'Craft' : 'Need more shards'}
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
                <div style={{ color: '#9CA3AF' }}>Model</div>
                <div style={{ textAlign: 'right' }}>Basic (100%)</div>
                <div style={{ color: '#9CA3AF' }}>Symbol</div>
                <div style={{ textAlign: 'right' }}>Default</div>
                <div style={{ color: '#9CA3AF' }}>Backdrop</div>
                <div style={{ textAlign: 'right' }}>—</div>
                <div style={{ color: '#9CA3AF' }}>Mintable</div>
                <div style={{ textAlign: 'right' }}>Yes</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button className={styles.inventoryButton} onClick={() => { sellInventoryItem(selectedInventoryItem.id); setSelectedItemId(null); }}>
                  Sell ({selectedInventoryItem.prize.price.toFixed(2)})
                </Button>
                <Button className={styles.inventoryButton} onClick={() => { receiveInventoryItem(selectedInventoryItem.id); window.open('https://t.me/BotFather', '_blank'); }}>
                  Receive
                </Button>
                <Button className={styles.inventoryButton} onClick={() => setSelectedItemId(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}; 