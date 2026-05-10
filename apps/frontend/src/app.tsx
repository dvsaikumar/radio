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
    console.log("FETCHING START...");
    fetch(`${BACKEND_URL}/api/tracks`)
      .then(res => res.json())
      .then(data => {
        const trackList = data.tracks || [];
        setTracks(trackList);
        if (trackList.length > 0) {
          setCurrentTrack(trackList[0]);
        }
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  return (
    <div class="app-container">
      <Sidebar tracks={tracks} currentTrack={currentTrack} onSelectTrack={setCurrentTrack} />
      <div class="main-content">
        <header>
          <h1 style={{color: '#ff4b2b', fontSize: '2.5rem', textShadow: '0 0 20px rgba(255,75,43,0.5)'}}>
            RAMA RADIO FIXED
          </h1>
          <p>Live Streaming: {tracks.length > 0 ? tracks[0].title : "Checking database..."}</p>
        </header>
        <main>
          {currentTrack ? (
            <AudioPlayer track={currentTrack} />
          ) : (
            <div class="loading" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
              {tracks.length === 0 ? "No tracks found. Please run the D1 insert command!" : "Loading stream..."}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
