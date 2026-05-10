import { useState } from 'preact/hooks';
import { Track } from '../app';

interface SidebarProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
}

export function Sidebar({ tracks, currentTrack, onSelectTrack }: SidebarProps) {
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
        {tracks.length === 0 && !isCollapsed && (
          <div style={{padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>No songs found.</div>
        )}
        {tracks.map((song) => (
          <div 
            key={song.id} 
            class={`song-item focusable ${currentTrack?.id === song.id ? 'active' : ''}`} 
            tabIndex={0}
            onClick={() => onSelectTrack(song)}
          >
            {!isCollapsed ? (
              <div class="song-info">
                <div class="song-title">{song.title}</div>
                <div class="song-artist">{song.artist}</div>
              </div>
            ) : (
              <div class="song-initial">{song.title[0]}</div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
