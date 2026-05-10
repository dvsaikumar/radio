import { useState, useEffect } from 'preact/hooks';
import { AudioPlayer } from './components/AudioPlayer';
import { Sidebar } from './components/Sidebar';

export const BACKEND_URL = 'https://radio-backend.dvsaikumar.workers.dev';

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

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/tracks`)
      .then(res => res.json())
      .then(data => {
        if (data.tracks && data.tracks.length > 0) {
          setTracks(data.tracks);
          setCurrentTrack(data.tracks[0]);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div class="app-container">
      <Sidebar tracks={tracks} currentTrack={currentTrack} onSelectTrack={setCurrentTrack} />
      <div class="main-content">
        <header>
          <h1>Ramam</h1>
          <p>Premium Radio Streaming</p>
        </header>
        <main>
          {currentTrack ? (
            <AudioPlayer track={currentTrack} />
          ) : (
            <div class="loading" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>Loading amazing tunes...</div>
          )}
        </main>
      </div>
    </div>
  );
}
