import React from 'react';
import styles from '../ProfilePage.module.css';
import { User } from '@/types/user';

interface ProfileHeaderProps {
  user: User;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <div className={styles.userProfile}>
      <div className={styles.profileInfo}>
        <div className={styles.avatars}>
          <img src={user.avatar} alt="User avatar" className={styles.profileAvatar} />
        </div>
        <div className={styles.profileDetails}>
          <div className={styles.profileName}>{user.name}</div>
          <div className={styles.profileId}>#{user.id}</div>
        </div>
      </div>
    </div>
  );
};



