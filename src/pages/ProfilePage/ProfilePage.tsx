import React, { useMemo, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import styles from './ProfilePage.module.css';
import { SHARD_PRODUCTS } from '@/utils/constants';
import { Modal } from '@/components/ui/Modal';
import { PrizeModal } from '@/components/game/PrizeCard';
import { DepositModal } from '@/components/profile/DepositModal';
import { ProfileHeader } from './components/ProfileHeader';
import { WalletCard } from './components/WalletCard';
import { InviteBanner } from './components/InviteBanner';
import { BalanceSection } from './components/BalanceSection';
import { InventorySection } from './components/InventorySection';
import { ShardProgress } from './components/ShardProgress';
import { PrizeItem } from '@/domain/items/PrizeItem';
import { ASSETS } from '@/constants/assets';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';
import { usePrizeDescription } from '@/i18n/prizeDescriptions';
// import { InventoryItemSkeleton } from '@/components/profile/InventoryItemSkeleton';
// import { InventoryGrid } from '@/components/widgets/InventoryGrid/InventoryGrid';

export const ProfilePage: React.FC = () => {
  const { t } = useI18n();
  const getDescription = usePrizeDescription();
  const { user, disconnectWallet, craftFromShards, sellInventoryItem, receiveInventoryItem, isLoading, loadInventory, inventoryFetched } = useUserStore();
  const { isModalOpen, modalType, openModal, closeModal } = useUIStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedShardKey, setSelectedShardKey] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);
  const isOnline = useOnlineStatus();
  const [hideInventoryError, setHideInventoryError] = useState<boolean>(false);
  const [inventoryOfflinePhase, setInventoryOfflinePhase] = useState<'idle' | 'loading' | 'error'>('idle');
  const [inventoryActionLock, setInventoryActionLock] = useState<boolean>(false);

  // Reset action lock whenever modal target changes (open/close or switch item)
  React.useEffect(() => {
    setInventoryActionLock(false);
  }, [selectedItemId]);

  // Управляем показом: при офлайне сначала короткий прелоадер, затем ошибка
  React.useEffect(() => {
    if (!isOnline) {
      setInventoryOfflinePhase('loading');
      const t = window.setTimeout(() => setInventoryOfflinePhase('error'), 800);
      return () => clearTimeout(t);
    }
    // Вернулись онлайн — сброс
    setHideInventoryError(false);
    setInventoryOfflinePhase('idle');
    // подгрузим инвентарь только один раз при первом заходе
    if (!inventoryFetched && !isLoading) {
      // На слабых девайсах даём кадр отрисоваться
      const id = window.requestIdleCallback ? window.requestIdleCallback(() => loadInventory()) : window.setTimeout(() => loadInventory(), 0);
      return () => { if (typeof id === 'number') clearTimeout(id); };
    }
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
      <ProfileHeader user={user} />

      <BalanceSection balance={user.balance} onDeposit={() => openModal('deposit')} />

      {/* Wallet Section */}
      <WalletCard address={user.wallet} onDisconnect={disconnectWallet} label={t('common.connectedWallet')} disconnectText={t('common.disconnect')} />

      {/* Deposit Modal */}
      <DepositModal isOpen={isModalOpen && modalType === 'deposit'} onClose={closeModal} />

      {/* Invite Friends Section */}
      <InviteBanner title={t('common.inviteTitle')} cta={t('common.inviteCta')} />

      {/* Inventory Section: hide in offline mode, show only error and retry */}
      <div className={styles.inventoryContainer}>
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
        {isOnline && (
          <InventorySection
            combined={combinedInventory as any}
            visible={visibleInventory as any}
            isOnline={isOnline}
            isLoading={isLoading}
            inventoryFetched={inventoryFetched}
            showOnlyAvailable={showOnlyAvailable}
            setShowOnlyAvailable={(v) => setShowOnlyAvailable(v)}
            onSelectItem={(id) => setSelectedItemId(id)}
            onSelectShard={(key) => setSelectedShardKey(key)}
          />
        )}
      </div>

      {/* Modal: Shard crafting */}
      <Modal
        isOpen={!!selectedShardKey}
        onClose={() => setSelectedShardKey(null)}
        title={t('modal.craftTitle')}
        size="md"
      >
        <ShardProgress
          selectedShardKey={selectedShardKey}
          setSelectedShardKey={setSelectedShardKey}
          shards={user.shards || {}}
          onCraft={(key) => craftFromShards(key, 'Craft')}
        />
      </Modal>

      {/* Modal: Inventory item actions */}
      <PrizeModal
        isOpen={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        title={selectedInventoryItem?.prize.name}
        image={selectedInventoryItem?.prize.image || ''}
        description={getDescription(selectedInventoryItem?.prize)}
        rows={selectedInventoryItem ? [
          { label: t('roulette.rarity'), value: (() => {
            const r = selectedInventoryItem.prize.rarity;
            return t(`roulette.rarityNames.${r}`);
          })() }
        ] : undefined}
        actions={selectedInventoryItem && (
          <div className={styles.invActions}>
            <Button
              className={styles.receiveBtn}
              onClick={() => {
                if (inventoryActionLock) return;
                setInventoryActionLock(true);
                try {
                  receiveInventoryItem(selectedInventoryItem.id);
                } finally {
                  setSelectedItemId(null);
                  window.open('https://t.me/BotFather', '_blank');
                }
              }}
            >
              {t('common.receive')}
            </Button>
            <Button
              className={styles.quickSellBtn}
              onClick={() => {
                if (inventoryActionLock) return;
                setInventoryActionLock(true);
                try {
                  sellInventoryItem(selectedInventoryItem.id);
                } finally {
                  setSelectedItemId(null);
                }
              }}
            >
              <span style={{ color: 'white', fontSize: '14px' }}>{t('roulette.quickSell')}</span>
              <span className={styles.quickSellRight}>
                {selectedInventoryItem.prize.price.toFixed(2)}
                <img src={ASSETS.IMAGES.TON} alt="TON" className={styles.tonIconSmall} />
              </span>
            </Button>
          </div>
        )}
      />
    </div></div>
  );
}; 