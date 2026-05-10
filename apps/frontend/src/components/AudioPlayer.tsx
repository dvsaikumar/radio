import { useEffect, useRef, useState } from 'preact/hooks';
import { useSpatialNav } from '../hooks/useSpatialNav';

// SVG Icons
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const PrevIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const NextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.59 9.17L5.41 4L4 5.41l5.17 5.17l1.42-1.41zM14.5 4l2.04 2.04L4 18.59L5.41 20L17.96 7.45L20 9.5V4h-5.5zm.73 11.08l-1.41 1.41l3.13 3.13L14.5 22H20v-5.5l-2.04 2.04l-2.73-2.73z" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 7h10v3l4-4l-4-4v3H5v6h2V7zm10 10H7v-3l-4 4l4 4v-3h12v-6h-2v4z" />
  </svg>
);

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navRef = useSpatialNav();

  // Mock track data for demonstration
  const currentTrack = {
    id: '123',
    title: 'Neon Nights',
    artist: 'Synthwave Dreams',
    album: 'Cyber City',
    coverUrl: 'https://via.placeholder.com/150',
    // Example stream URL pointing to our backend edge proxy
    // streamUrl: 'http://localhost:8787/stream/123'
    streamUrl: '' // Empty for mock
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay(true));
      navigator.mediaSession.setActionHandler('pause', () => togglePlay(false));
    }
  }, [currentTrack]);

  const togglePlay = (forceState?: boolean) => {
    const newState = forceState !== undefined ? forceState : !isPlaying;
    setIsPlaying(newState);
    
    if (audioRef.current && currentTrack.streamUrl) {
      if (newState) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  // Mock progress simulation since we don't have a real stream URL playing
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !currentTrack.streamUrl) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div class="player-card" ref={navRef}>
      <div class="track-info">
        <div class="track-title">{currentTrack.title}</div>
        <div class="track-artist">{currentTrack.artist}</div>
      </div>

      <div class="progress-container">
        <span>0:00</span>
        <div class="progress-bar focusable" tabIndex={0}>
          <div class="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <span>3:45</span>
      </div>

      <div class="controls">
        <button 
          class={`btn secondary-btn focusable ${isShuffle ? 'active' : ''}`} 
          tabIndex={0}
          onClick={() => setIsShuffle(!isShuffle)}
          title="Shuffle"
        >
          <ShuffleIcon />
        </button>
        <button class="btn focusable" tabIndex={0}>
          <PrevIcon />
        </button>
        <button 
          class="btn play-btn focusable" 
          tabIndex={0}
          onClick={() => togglePlay()}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button class="btn focusable" tabIndex={0}>
          <NextIcon />
        </button>
        <button 
          class={`btn secondary-btn focusable ${isRepeat ? 'active' : ''}`} 
          tabIndex={0}
          onClick={() => setIsRepeat(!isRepeat)}
          title="Repeat"
        >
          <RepeatIcon />
        </button>
      </div>

      <audio 
        ref={audioRef} 
        src={currentTrack.streamUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
