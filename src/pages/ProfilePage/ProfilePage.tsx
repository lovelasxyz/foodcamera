import React from 'react';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const { user, disconnectWallet } = useUserStore();
  const { setActivePage } = useUIStore();

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
                      src="/assets/images/ton.svg" 
                      alt="TON" 
                      style={{ width: '25px', height: '25px' }}
             />
          </div>
        </div>
        <Button className={styles.depositButton}>
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

      {/* Invite Friends Section */}
      <div className={styles.inviteContainer}>
        <div className={styles.inviteContent}>
          <div className={styles.inviteIcon}>👥</div>
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
          <Button className={styles.inventoryButton}>
            Show available
          </Button>
        </div>
        
        <div className={styles.inventorySection}>
          {user.inventory.length === 0 ? (
            <div className={styles.emptyInventory}>
              <p>You haven&apos;t opened any cases yet</p>
              <Button className={styles.openCasesButton} onClick={() => setActivePage('main')}>
                Open Cases
              </Button>
            </div>
          ) : (
            <div className={styles.inventoryGrid}>
              {user.inventory.map((item) => (
                <div key={item.id} className={styles.inventoryItem}>
                  <img 
                    src={item.prize.image} 
                    alt={item.prize.name} 
                    className={styles.itemImage}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 