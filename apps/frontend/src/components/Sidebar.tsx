import { useState } from 'preact/hooks';
import { Track } from '../app';

interface SidebarProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
}

export function Sidebar({ tracks, onSelectTrack }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

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
            class="song-item focusable" 
            tabIndex={0}
            onClick={() => onSelectTrack(song)}
          >
            <div class="song-initial">{song.title[0]}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
