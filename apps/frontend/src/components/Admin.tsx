import { useState } from 'preact/hooks';
import { Track, BACKEND_URL } from '../app';

export function Admin({ tracks, onRefresh }: { tracks: Track[], onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({ title: '', artist: '' });
  const [file, setFile] = useState<File | null>(null);

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
        alert('Track added successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

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
      <button class="btn admin-toggle-btn focusable" onClick={() => setIsOpen(true)}>
        ⚙️ Admin
      </button>
    );
  }

  return (
    <div class="admin-overlay">
      <div class="admin-modal">
        <div class="admin-header">
          <h2>Management Dashboard</h2>
          <button class="btn close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <section class="upload-section">
          <h3>Add New Track</h3>
          <form onSubmit={handleUpload} class="admin-form">
            <input 
              type="text" 
              placeholder="Song Title" 
              value={formData.title} 
              onInput={(e) => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })}
              required
            />
            <input 
              type="text" 
              placeholder="Artist Name" 
              value={formData.artist} 
              onInput={(e) => setFormData({ ...formData, artist: (e.target as HTMLInputElement).value })}
              required
            />
            <input 
              type="file" 
              accept="audio/mpeg" 
              onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] || null)}
              required
            />
            <button type="submit" class="btn play-btn" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Add to Radio'}
            </button>
          </form>
        </section>

        <section class="manage-section">
          <h3>Current Tracks</h3>
          <div class="admin-track-list">
            {tracks.map(track => (
              <div key={track.id} class="admin-track-item">
                <div class="admin-track-info">
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </div>
                <button class="btn delete-btn" onClick={() => handleDelete(track.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
