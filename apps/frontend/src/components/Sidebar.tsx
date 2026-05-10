import { useState } from 'preact/hooks';

interface Song {
  id: string;
  title: string;
  artist: string;
}

const mockSongs: Song[] = [
  { id: '1', title: 'Neon Nights', artist: 'Synthwave Dreams' },
  { id: '2', title: 'Stellar Drift', artist: 'Cosmic Voyager' },
  { id: '3', title: 'Midnight City', artist: 'Electro Pulse' },
  { id: '4', title: 'Echoes in Time', artist: 'Retro Future' },
  { id: '5', title: 'Plasma Core', artist: 'Cyber Punk' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside class={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div class="sidebar-header">
        {!isCollapsed && <span class="sidebar-title">Playlist</span>}
        <button 
          class="collapse-btn focusable" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      
      <div class="song-list">
        {mockSongs.map((song) => (
          <div key={song.id} class="song-item focusable" tabIndex={0}>
            {!isCollapsed ? (
              <>
                <div class="song-info">
                  <div class="song-title">{song.title}</div>
                  <div class="song-artist">{song.artist}</div>
                </div>
              </>
            ) : (
              <div class="song-initial">{song.title[0]}</div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
