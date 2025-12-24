/**
 * AURA Cloud Studio - Play Button Component
 *
 * 재생/정지 버튼 (네온 글로우 효과)
 * - isPlaying = true: 네온 글로우 ON (재생 중)
 * - isPlaying = false: 글로우 OFF (정지 상태)
 */

import React from 'react';
import { useAudioStore, selectIsPlaying } from '../../stores/audioStore';
import styles from './PlayButton.module.css';

interface PlayButtonProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * PlayButton - 재생/정지 토글 버튼
 *
 * 클릭 시:
 * - 정지 상태 → play() 호출
 * - 재생 상태 → stop() 호출
 */
export const PlayButton: React.FC<PlayButtonProps> = ({
  size = 'medium',
  className = '',
}) => {
  const isPlaying = useAudioStore(selectIsPlaying);
  const isInitialized = useAudioStore(state => state.isInitialized);
  const play = useAudioStore(state => state.play);
  const stop = useAudioStore(state => state.stop);
  const initializeEngine = useAudioStore(state => state.initializeEngine);

  const handleClick = async () => {
    // 첫 클릭 시 오디오 엔진 초기화 (Web Audio API 정책)
    if (!isInitialized) {
      try {
        await initializeEngine();
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
        return;
      }
    }

    // 토글 로직
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const buttonClasses = [
    styles.playButton,
    styles[size],
    isPlaying ? styles.playing : styles.stopped,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      aria-label={isPlaying ? 'Stop' : 'Play'}
      type="button"
    >
      <span className={styles.icon}>
        {isPlaying ? <StopIcon /> : <PlayIcon />}
      </span>
      {isPlaying && <span className={styles.glowRing} />}
    </button>
  );
};

/**
 * Play 아이콘 (삼각형)
 */
const PlayIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={styles.svg}
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

/**
 * Stop 아이콘 (사각형)
 */
const StopIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={styles.svg}
  >
    <rect x="6" y="6" width="12" height="12" />
  </svg>
);

export default PlayButton;
