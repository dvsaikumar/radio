import { Track } from '../app';
import { Admin } from './Admin';

interface SidebarProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  onRefreshTracks: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ tracks, currentTrack, onSelectTrack, onRefreshTracks, isCollapsed, setIsCollapsed }: SidebarProps) {

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
            class={`song-item focusable ${(!isCollapsed && currentTrack?.id === song.id) ? 'active' : ''}`} 
            tabIndex={0}
            onClick={() => onSelectTrack(song)}
          >
            {!isCollapsed ? (
              <div class="song-info-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div class="song-info">
                  <div class="song-title">{song.title}</div>
                  <div class="song-artist">{song.artist}</div>
                </div>
                <div class="song-duration" style={{ fontSize: '0.8rem', opacity: 0.6 }}>3:45</div>
              </div>
            ) : (
              <div class="song-initial">{song.title[0]}</div>
            )}
          </div>
        ))}
      </div>

      <div class="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
        <Admin onRefresh={onRefreshTracks} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
