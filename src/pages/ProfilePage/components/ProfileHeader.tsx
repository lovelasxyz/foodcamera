import React, { useRef } from 'react';
import styles from '../ProfilePage.module.css';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

interface ProfileHeaderProps {
  user: User;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const navigate = useNavigate();
  const tapCountRef = useRef(0);
  const lastTapRef = useRef<number>(0);

  const onAvatarClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 1200) {
      tapCountRef.current = 0;
    }
    lastTapRef.current = now;
    tapCountRef.current += 1;
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      navigate(ROUTES.logs);
    }
  };
  return (
    <div className={styles.userProfile}>
      <div className={styles.profileInfo}>
        <div className={styles.avatars}>
          <img src={user.avatar} alt="User avatar" className={styles.profileAvatar} onClick={onAvatarClick} />
        </div>
        <div className={styles.profileDetails}>
          <div className={styles.profileName}>{user.name}</div>
          <div className={styles.profileId}>#{user.id}</div>
        </div>
      </div>
    </div>
  );
};



