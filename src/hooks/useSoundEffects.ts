import { useRef } from 'react';

// 🆕 Хук для звуковых эффектов
const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playSound = (soundType: 'spin' | 'win' | 'rare') => {
    if (typeof window === 'undefined') return;

    const audioContext = getAudioContext();

    const sounds = {
      spin: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // громче
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);

        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
        };
      },
      win: () => {
        [261.63, 329.63, 392.0].forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);

          oscillator.start(audioContext.currentTime + i * 0.1);
          oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);

          oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
          };
        });
      },
      rare: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1);

        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
        };
      }
    };

    try {
      sounds[soundType]();
    } catch (error) {
      console.log('Sound not supported');
    }
  };

  return { playSound };
};

export default useSoundEffects; 