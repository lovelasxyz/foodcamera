import React from 'react';
import { Button } from '@/components/ui/Button';
import { ProgressiveImg } from '@/components/ui/ProgressiveImg';
import { ASSETS } from '@/constants/assets';
import { Slide } from '../hooks/useSlider';
import styles from '../../HomePage.module.css';

interface SlideViewProps {
  slide: Slide;
  shadowColor: string;
  onAction?: () => void;
}

export const SlideView: React.FC<SlideViewProps> = ({ slide, shadowColor, onAction }) => {
  const style = { boxShadow: `0 0 20px ${shadowColor}` };

  if (slide.kind === 'text') {
    return (
      <div className={styles.freeCaseSlide} style={style}>
        <div className={styles.bannerContent}>
          <div className={styles.lightningIcon}>
            <img src={ASSETS.IMAGES.LIGHTNING} alt="Lightning" />
          </div>
          <div className={styles.bannerText}>{slide.text}</div>
        </div>
        <Button size="sm" className={styles.telegramButton} onClick={onAction}>
          Open Case
        </Button>
      </div>
    );
  }

  const content = (
    <div className={`${styles.freeCaseSlide} ${styles.imageSlide}`} style={style}>
      {slide.kind === 'image' ? (
        <ProgressiveImg className={styles.imageSlideImage} src={slide.image || ''} alt="Slide" />
      ) : (
        <video
          className={styles.imageSlideImage}
          src={slide.video || ''}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
    </div>
  );

  return slide.href ? (
    <a href={slide.href} target="_blank" rel="noopener noreferrer" className={styles.imageLink}>
      {content}
    </a>
  ) : content;
};


