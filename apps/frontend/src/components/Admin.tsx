import { useState, useMemo } from 'preact/hooks';
import { Track, BACKEND_URL } from '../app';

export function Admin({ tracks, onRefresh, isCollapsed }: { tracks: Track[], onRefresh: () => void, isCollapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', artist: '' });
  const [file, setFile] = useState<File | null>(null);

  const filteredTracks = useMemo(() => 
    tracks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    ), [tracks, searchQuery]);

  const handleUpload = async (e: Event) => {
    e.preventDefault();
    if (!file || !formData.title || !formData.artist) return;

    setIsUploading(true);
    const body = new FormData();
    body.append('title', formData.title);
    body.append('artist', formData.artist);
    body.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tracks`, {
        method: 'POST',
        body,
      });
      if (res.ok) {
        setFormData({ title: '', artist: '' });
        setFile(null);
        onRefresh();
        alert('✨ Track synced to Studio Library!');
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
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        {/* Sidebar Nav */}
        <aside class="studio-sidebar">
          <div class="studio-logo">RAMAM STUDIO</div>
          <nav class="studio-nav">
            <div class="nav-item active">📊 Library</div>
            <div class="nav-item">📈 Analytics</div>
            <div class="nav-item">⚙️ Settings</div>
          </nav>
          <button class="btn exit-btn" onClick={() => setIsOpen(false)}>Exit Studio</button>
        </aside>

        {/* Main Content */}
        <main class="studio-main">
          <header class="studio-header">
            <div class="header-left">
              <h2>Media Library</h2>
              <p>Manage your global edge assets</p>
            </div>
            <div class="header-stats">
              <div class="stat-card">
                <span class="label">Total Tracks</span>
                <span class="value">{tracks.length}</span>
              </div>
              <div class="stat-card">
                <span class="label">Storage Status</span>
                <span class="value green">Active</span>
              </div>
            </div>
          </header>

          <div class="studio-grid">
            {/* Upload Card */}
            <section class="studio-card upload-card">
              <h3>Upload to Cloud</h3>
              <form onSubmit={handleUpload} class="studio-form">
                <div class="input-group">
                  <label>Track Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Midnight City" 
                    value={formData.title} 
                    onInput={(e) => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })}
                    required
                  />
                </div>
                <div class="input-group">
                  <label>Artist</label>
                  <input 
                    type="text" 
                    placeholder="e.g. M83" 
                    value={formData.artist} 
                    onInput={(e) => setFormData({ ...formData, artist: (e.target as HTMLInputElement).value })}
                    required
                  />
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
                    {file ? `✅ ${file.name}` : '📁 Drop MP3 here or click to browse'}
                  </label>
                </div>
                <button type="submit" class="btn studio-primary-btn" disabled={isUploading}>
                  {isUploading ? '🚀 Syncing to Edge...' : 'Publish to Radio'}
                </button>
              </form>
            </section>

            {/* Library Card */}
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
                      <th>Format</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracks.map(track => (
                      <tr key={track.id}>
                        <td class="bold">{track.title}</td>
                        <td>{track.artist}</td>
                        <td><span class="badge">MP3</span></td>
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
        </main>
      </div>
    </div>
  );
}
