import React from 'react';
import styles from '../ProfilePage.module.css';
import { ASSETS } from '@/constants/assets';

interface InviteBannerProps {
  title: string;
  cta: string;
}

export const InviteBanner: React.FC<InviteBannerProps> = ({ title, cta }) => {
  return (
    <div className={styles.inviteContainer}>
      {/* <img
        src={ASSETS.IMAGES.LIGHTNING_PNG}
        className={styles.inviteLightning}
      /> */}
      <div className={styles.inviteContent}>
        <img src={ASSETS.ICONS.INVITE} style={{ width: '35px', height: '35px' }} />
        <div className={styles.inviteText}>{title}</div>
      </div>
      <button className={styles.inviteButton}>
        {cta}
      </button>
    </div>
  );
};



