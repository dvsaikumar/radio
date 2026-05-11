import { useState, useEffect } from 'preact/hooks';
import { AudioPlayer } from './components/AudioPlayer';
import { Sidebar } from './components/Sidebar';

export const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8787' 
  : 'https://radio-backend.dvsaikumar.workers.dev';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  r2_key: string;
}

export function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');

  const fetchTracks = () => {
    fetch(`${BACKEND_URL}/api/tracks`)
      .then(res => res.json())
      .then(data => {
        const trackList = data.tracks || [];
        setTracks(trackList);
        if (!currentTrack && trackList.length > 0) {
          setCurrentTrack(trackList[0]);
        }
      })
      .catch(err => console.error("API Error:", err));
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= tracks.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // End of playlist
      }
    }
    setCurrentTrack(tracks[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = tracks.length - 1;
    setCurrentTrack(tracks[prevIndex]);
  };

  return (
    <div class="app-container">
      <Sidebar 
        tracks={tracks} 
        currentTrack={currentTrack} 
        onSelectTrack={setCurrentTrack} 
        onRefreshTracks={fetchTracks}
      />
      <div class="main-content">
        <header>
          <h1 style={{ color: '#00ffcc', textTransform: 'uppercase' }}>Ramam</h1>
          <p>Online Radio Station</p>
          <p>Status: {tracks.length > 0 ? "Online" : "Connecting to Database..."}</p>
        </header>
        <main>
          {currentTrack ? (
            <AudioPlayer 
              track={currentTrack} 
              onNext={handleNext} 
              onPrev={handlePrev}
              repeatMode={repeatMode}
              setRepeatMode={setRepeatMode}
            />
          ) : (
            <div class="loading" style={{ textAlign: 'center', padding: '5rem' }}>
              <h2>{tracks.length === 0 ? "DATABASE EMPTY - USE ADMIN TO UPLOAD" : "LOADING TRACKS..."}</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
