import { useState, useMemo } from 'preact/hooks';
import { Track, BACKEND_URL } from '../app';

export interface Playlist {
  id: string;
  name: string;
  description: string;
}

export function Admin({ tracks, onRefresh, isCollapsed }: { tracks: Track[], onRefresh: () => void, isCollapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', artist: '', playlist_id: '' });
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library');

  const getAuthHeader = () => {
    return 'Basic ' + btoa(`${authData.username}:${authData.password}`);
  };

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/playlists`);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (e: Event) => {
    e.preventDefault();
    if (authData.username && authData.password) {
      setIsAuthenticated(true);
      fetchPlaylists();
    }
  };

  const handleCreatePlaylist = async (e: Event) => {
    e.preventDefault();
    if (!newPlaylist.name) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlaylist)
      });
      
      if (res.ok) {
        setNewPlaylist({ name: '', description: '' });
        await fetchPlaylists();
        onRefresh(); // Sync with App.tsx state
        alert('📂 Playlist created!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`❌ Failed to create playlist (Status ${res.status}): ${errorData.error || res.statusText || 'Unknown Error'}`);
      }
    } catch (err) {
      console.error('Playlist Creation Error:', err);
      alert('❌ Connection failed. Is the backend worker deployed and accessible?');
    }
  };

  const handleUpload = async (e: Event) => {
    e.preventDefault();
    if (!file || !formData.title || !formData.artist) return;

    setIsUploading(true);
    const body = new FormData();
    body.append('title', formData.title);
    body.append('artist', formData.artist);
    body.append('playlist_id', formData.playlist_id);
    body.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        },
        body,
      });
      if (res.ok) {
        setFormData({ ...formData, title: '', artist: '' });
        setFile(null);
        onRefresh();
        alert('✨ Track synced to Studio Library!');
      } else if (res.status === 401) {
        alert('❌ Invalid credentials.');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Sync failed. Check network.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('☢️ Permanently delete this track from Edge R2/D1?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/tracks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader()
        },
      });
      if (res.ok) {
        onRefresh();
      } else if (res.status === 401) {
        alert('❌ Unauthorized action.');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTracks = useMemo(() => 
    tracks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    ), [tracks, searchQuery]);

  if (!isOpen) {
    return (
      <button 
        class={`btn admin-toggle-btn studio-btn focusable ${isCollapsed ? 'compact' : ''}`} 
        onClick={() => setIsOpen(true)}
        title="Studio Dashboard"
        style={{ width: '100%', borderRadius: '12px', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0' : '0 1rem' }}
      >
        <span class="icon">💠</span> {!isCollapsed && <span style={{ marginLeft: '10px' }}>Studio Dashboard</span>}
      </button>
    );
  }

  return (
    <div class="studio-overlay">
      <div class="studio-container">
        <aside class="studio-sidebar">
          <div class="studio-logo">RAMAM STUDIO</div>
          <nav class="studio-nav">
            <div 
              class={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
            >
              📊 Library
            </div>
            <div 
              class={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`}
              onClick={() => setActiveTab('playlists')}
            >
              📂 Playlists
            </div>
          </nav>
          <button class="btn exit-btn" onClick={() => setIsOpen(false)}>Exit Studio</button>
        </aside>

        <main class="studio-main">
          {!isAuthenticated ? (
            <div class="studio-login-overlay">
              <section class="studio-card login-card">
                <div class="login-header">
                  <div class="lock-icon">🔒</div>
                  <h2>Authorized Access Only</h2>
                  <p>Please enter your credentials to manage the station.</p>
                </div>
                <form onSubmit={handleLogin} class="studio-form">
                  <div class="input-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      placeholder="Enter username" 
                      value={authData.username} 
                      onInput={(e) => setAuthData({ ...authData, username: (e.target as HTMLInputElement).value })}
                      required
                    />
                  </div>
                  <div class="input-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={authData.password} 
                      onInput={(e) => setAuthData({ ...authData, password: (e.target as HTMLInputElement).value })}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    class="btn studio-primary-btn"
                    style={{ width: '100%', height: 'auto', padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary)', color: 'black', fontWeight: 'bold', marginTop: '1rem' }}
                  >
                    Unlock Studio
                  </button>
                </form>
              </section>
            </div>
          ) : (
            <>
              <header class="studio-header">
                <div class="header-left">
                  <h2 style={{ fontSize: '2rem' }}>{activeTab === 'library' ? 'Studio Library' : 'Playlists'}</h2>
                  <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Global edge assets</p>
                </div>
                <div class="header-stats">
                  <div class="stat-card">
                    <span class="label">{activeTab === 'library' ? 'Tracks' : 'Collections'}</span>
                    <span class="value">{activeTab === 'library' ? tracks.length : playlists.length}</span>
                  </div>
                  <div class="stat-card">
                    <span class="label">Status</span>
                    <span class="value green">Online</span>
                  </div>
                </div>
              </header>

              <div class="studio-grid">
                {activeTab === 'library' ? (
                  <>
                    <div class="upload-card-pane">
                      <section class="studio-card upload-card">
                        <h3 style={{ marginBottom: '1rem' }}>Upload Track</h3>
                        <form onSubmit={handleUpload} class="studio-form">
                          <div class="input-group">
                            <label>Title</label>
                            <input 
                              type="text" 
                              placeholder="Midnight City" 
                              value={formData.title} 
                              onInput={(e) => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })}
                              required
                            />
                          </div>
                          <div class="input-group">
                            <label>Artist</label>
                            <input 
                              type="text" 
                              placeholder="M83" 
                              value={formData.artist} 
                              onInput={(e) => setFormData({ ...formData, artist: (e.target as HTMLInputElement).value })}
                              required
                            />
                          </div>
                          <div class="input-group">
                            <label>Assign to Playlist</label>
                            <select 
                              value={formData.playlist_id}
                              onChange={(e) => setFormData({ ...formData, playlist_id: (e.target as HTMLSelectElement).value })}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '4px' }}
                            >
                              <option value="">None (Standalone)</option>
                              {playlists.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div class="file-upload-zone">
                            <input 
                              type="file" 
                              id="file-input"
                              accept="audio/mpeg" 
                              onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] || null)}
                              required
                              class="hidden-input"
                            />
                            <label for="file-input" class="file-label">
                              <div class="upload-icon">📁</div>
                              <div class="upload-text">{file ? file.name : 'Choose MP3 File'}</div>
                              <div class="upload-subtext">or drag and drop here</div>
                            </label>
                          </div>
                          <button 
                            type="submit" 
                            class="btn studio-primary-btn" 
                            disabled={isUploading}
                            style={{ width: '100%', height: 'auto', padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary)', color: 'black', fontWeight: 'bold', marginTop: '1rem' }}
                          >
                            {isUploading ? '🚀 Uploading...' : 'Sync to Cloud'}
                          </button>
                        </form>
                      </section>
                    </div>

                    <div class="library-card-pane">
                      <section class="studio-card library-card">
                        <div class="card-header">
                          <h3>Track Library</h3>
                          <input 
                            type="text" 
                            placeholder="Search library..." 
                            class="studio-search"
                            value={searchQuery}
                            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                          />
                        </div>
                        <div class="library-table-container">
                          <table class="library-table">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Artist</th>
                                <th>Playlist</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTracks.map(track => (
                                <tr key={track.id}>
                                  <td class="bold">{track.title}</td>
                                  <td>{track.artist}</td>
                                  <td><span class="badge">{playlists.find(p => p.id === track.playlist_id)?.name || 'None'}</span></td>
                                  <td>
                                    <button class="btn studio-delete-btn" onClick={() => handleDelete(track.id)}>
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </>
                ) : (
                  <>
                    <div class="upload-card-pane">
                      <section class="studio-card upload-card">
                        <h3 style={{ marginBottom: '1rem' }}>Create Playlist</h3>
                        <form onSubmit={handleCreatePlaylist} class="studio-form">
                          <div class="input-group">
                            <label>Playlist Name</label>
                            <input 
                              type="text" 
                              placeholder="My Top 10" 
                              value={newPlaylist.name} 
                              onInput={(e) => setNewPlaylist({ ...newPlaylist, name: (e.target as HTMLInputElement).value })}
                              required
                            />
                          </div>
                          <div class="input-group">
                            <label>Description</label>
                            <input 
                              type="text" 
                              placeholder="Best of 2024" 
                              value={newPlaylist.description} 
                              onInput={(e) => setNewPlaylist({ ...newPlaylist, description: (e.target as HTMLInputElement).value })}
                            />
                          </div>
                          <button 
                            type="submit" 
                            class="btn studio-primary-btn"
                            style={{ width: '100%', height: 'auto', padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary)', color: 'black', fontWeight: 'bold', marginTop: '1rem' }}
                          >
                            Create Collection
                          </button>
                        </form>
                      </section>
                    </div>
                    <div class="library-card-pane">
                      <section class="studio-card library-card">
                        <h3>Existing Playlists</h3>
                        <div class="library-table-container">
                          <table class="library-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Tracks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {playlists.map(p => (
                                <tr key={p.id}>
                                  <td class="bold">{p.name}</td>
                                  <td>{p.description}</td>
                                  <td>{tracks.filter(t => t.playlist_id === p.id).length}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
