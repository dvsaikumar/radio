import { useState, useEffect } from 'preact/hooks';
import { AudioPlayer } from './components/AudioPlayer';
import { Sidebar } from './components/Sidebar';
import { Playlist } from './components/Admin';

export const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8787' 
  : 'https://radio-backend.dvsaikumar.workers.dev';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  r2_key: string;
  playlist_id: string;
}

export function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/playlists`)
      .then(res => res.json())
      .then(data => {
        setPlaylists(data.playlists || []);
        
        // Handle Deep Linking
        const path = window.location.pathname.substring(1); // e.g. "playlist1"
        if (path) {
          const playlistName = decodeURIComponent(path);
          fetch(`${BACKEND_URL}/api/playlists/name/${playlistName}`)
            .then(res => res.json())
            .then(pData => {
              if (pData.playlist) {
                setCurrentPlaylist(pData.playlist);
                setTracks(pData.tracks || []);
                if (pData.tracks?.length > 0) {
                  setCurrentTrack(pData.tracks[0]);
                }
              }
            }).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("API Error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handlePlaylistSelect = (playlist: Playlist) => {
    window.history.pushState({}, '', `/${encodeURIComponent(playlist.name)}`);
    setLoading(true);
    fetch(`${BACKEND_URL}/api/playlists/${playlist.id}/tracks`)
      .then(res => res.json())
      .then(data => {
        setCurrentPlaylist(playlist);
        setTracks(data.tracks || []);
        if (data.tracks?.length > 0) {
          setCurrentTrack(data.tracks[0]);
        }
      })
      .finally(() => setLoading(false));
  };

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
    <div class={`app-container ${isSidebarCollapsed ? 'collapsed-layout' : ''}`}>
      <Sidebar 
        tracks={tracks} 
        currentTrack={currentTrack} 
        onSelectTrack={setCurrentTrack} 
        onRefreshTracks={fetchPlaylists}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div class="main-content">
        <header>
          <h1 style={{ color: '#00ffcc', textTransform: 'uppercase', cursor: 'pointer' }} onClick={() => { window.history.pushState({}, '', '/'); setCurrentPlaylist(null); }}>Ramam</h1>
          <p>Online Radio Station</p>
          <p>Status: {playlists.length > 0 ? "Online" : "Connecting..."}</p>
        </header>
        <main>
          {loading ? (
            <div class="loading"><h2>SYNCING...</h2></div>
          ) : !currentPlaylist ? (
            <div class="playlist-grid">
              {playlists.map(p => (
                <div key={p.id} class="playlist-card-select focusable" tabIndex={0} onClick={() => handlePlaylistSelect(p)}>
                  <div class="playlist-icon">📁</div>
                  <h3>{p.name}</h3>
                  <p>{p.description || "Collection"}</p>
                </div>
              ))}
              {playlists.length === 0 && <h2>No Playlists found. Use Admin to create one.</h2>}
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <h2 style={{ marginBottom: '2rem', opacity: 0.5 }}>{currentPlaylist.name}</h2>
               {currentTrack ? (
                <AudioPlayer 
                  track={currentTrack} 
                  onNext={handleNext} 
                  onPrev={handlePrev}
                  repeatMode={repeatMode}
                  setRepeatMode={setRepeatMode}
                />
              ) : (
                <div class="loading">
                  <h2>PLAYLIST EMPTY</h2>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <div class="symmetry-buffer"></div>
    </div>
  );
}
