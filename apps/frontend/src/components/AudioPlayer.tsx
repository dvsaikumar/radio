import { useEffect, useRef, useState } from 'preact/hooks';
import { useSpatialNav } from '../hooks/useSpatialNav';
import { Track, BACKEND_URL } from '../app';

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

export function AudioPlayer({ track }: { track: Track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navRef = useSpatialNav();

  const streamUrl = `${BACKEND_URL}/stream/${track.id}`;

  useEffect(() => {
    // Reset play state and progress when track changes
    setProgress(0);
    
    // Auto-play when track changes (if allowed by browser policy)
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.log("Autoplay prevented:", e);
          setIsPlaying(false);
        });
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || '',
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay(true));
      navigator.mediaSession.setActionHandler('pause', () => togglePlay(false));
    }
  }, [track]);

  const togglePlay = (forceState?: boolean) => {
    const newState = forceState !== undefined ? forceState : !isPlaying;
    setIsPlaying(newState);
    
    if (audioRef.current) {
      if (newState) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLDivElement;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const newTime = percentage * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(percentage * 100);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration && !isNaN(duration)) {
        setProgress((current / duration) * 100);
      }
    }
  };

  return (
    <div class="player-card" ref={navRef}>
      <div class="track-info">
        <div class="track-title">{track.title}</div>
        <div class="track-artist">{track.artist}</div>
      </div>

      <div class="progress-section">
        <div class="progress-container">
          <div 
            class="progress-bar focusable" 
            tabIndex={0}
            onClick={handleSeek}
            style={{ cursor: 'pointer' }}
          >
            <div class="progress" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div class="time-display" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
          <span>{audioRef.current ? formatTime(audioRef.current.duration) : "0:00"}</span>
        </div>
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
        src={streamUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
    </div>
  );
}
