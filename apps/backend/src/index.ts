import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { basicAuth } from 'hono/basic-auth';

type Bindings = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health check
app.get('/', (c) => c.text('Radio Edge API is running!'));

// Get all playlists
app.get('/api/playlists', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Playlists ORDER BY name ASC').all();
  return c.json({ playlists: results });
});

// Admin: Create new playlist
app.post('/api/playlists', (c, next) => {
  return basicAuth({
    username: c.env.ADMIN_USERNAME || 'admin',
    password: c.env.ADMIN_PASSWORD || 'password',
  })(c, next);
}, async (c) => {
  try {
    const { name, description } = await c.req.json();
    if (!name) return c.json({ error: 'Name is required' }, 400);
    
    const id = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO Playlists (id, name, description) VALUES (?, ?, ?)')
      .bind(id, name, description).run();
    
    return c.json({ success: true, playlist: { id, name, description } });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message.includes('UNIQUE') ? 'Playlist name already exists' : err.message }, 500);
  }
});

// Get tracks for a specific playlist
app.get('/api/playlists/:id/tracks', async (c) => {
  const playlistId = c.req.param('id');
  const { results } = await c.env.DB.prepare('SELECT * FROM Tracks WHERE playlist_id = ? ORDER BY created_at DESC')
    .bind(playlistId).all();
  return c.json({ tracks: results });
});

// Get playlist by name (for deep linking)
app.get('/api/playlists/name/:name', async (c) => {
  const name = c.req.param('name');
  const playlist = await c.env.DB.prepare('SELECT * FROM Playlists WHERE name = ? COLLATE NOCASE')
    .bind(name).first();
  if (!playlist) return c.notFound();
  
  const { results } = await c.env.DB.prepare('SELECT * FROM Tracks WHERE playlist_id = ? ORDER BY created_at DESC')
    .bind(playlist.id).all();
  
  return c.json({ playlist, tracks: results });
});

// Get all tracks from D1 (Fallback/Discovery)
app.get('/api/tracks', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Tracks ORDER BY created_at DESC').all();
  return c.json({ tracks: results });
});

// Admin: Add new track (Upload to R2 + Insert to D1)
app.post('/api/tracks', (c, next) => {
  return basicAuth({
    username: c.env.ADMIN_USERNAME || 'admin',
    password: c.env.ADMIN_PASSWORD || 'password',
  })(c, next);
}, async (c) => {
  try {
    const formData = await c.req.parseBody();
    const title = formData.title as string;
    const artist = formData.artist as string;
    const playlistId = formData.playlist_id as string;
    const file = formData.file as File;

    if (!title || !artist || !file) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const id = crypto.randomUUID();
    const fileName = `${id}-${file.name}`;

    // 1. Upload to R2
    await c.env.MEDIA_BUCKET.put(fileName, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    // 2. Insert into D1
    await c.env.DB.prepare(
      'INSERT INTO Tracks (id, title, artist, r2_key, playlist_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, title, artist, fileName, playlistId || null).run();

    return c.json({ success: true, track: { id, title, artist, r2_key: fileName, playlist_id: playlistId } });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Delete track (Delete from D1 + Delete from R2)
app.delete('/api/tracks/:id', (c, next) => {
  return basicAuth({
    username: c.env.ADMIN_USERNAME || 'admin',
    password: c.env.ADMIN_PASSWORD || 'password',
  })(c, next);
}, async (c) => {
  const id = c.req.param('id');
  
  try {
    // Get R2 key first
    const track = await c.env.DB.prepare('SELECT r2_key FROM Tracks WHERE id = ?').bind(id).first();
    
    if (track && track.r2_key) {
      // 1. Delete from R2
      await c.env.MEDIA_BUCKET.delete(track.r2_key as string);
    }

    // 2. Delete from D1
    await c.env.DB.prepare('DELETE FROM Tracks WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Edge-Proxied Range Streaming from R2 (Supports both paths)
const streamHandler = async (c: any) => {
  const id = c.req.param('id');
  
  // Fetch track metadata to get R2 key
  const track = await c.env.DB.prepare('SELECT r2_key FROM Tracks WHERE id = ?').bind(id).first();
  
  if (!track || !track.r2_key) {
    return c.notFound();
  }

  const rangeHeader = c.req.header('range');
  let r2Key = track.r2_key as string;

  try {
    // Attempt to get the file
    let file = await c.env.MEDIA_BUCKET.get(r2Key);
    
    // Fallback: If Rama.mp3 is not found, try Rama
    if (!file && r2Key.endsWith('.mp3')) {
      const fallbackKey = r2Key.replace('.mp3', '');
      file = await c.env.MEDIA_BUCKET.get(fallbackKey);
    }

    if (!file) {
      return c.text('File not found in R2 bucket: ' + r2Key, 404);
    }

    const headers = new Headers();
    file.writeHttpMetadata(headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');

    // Handle Range Requests for seekability/duration
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.size - 1;
      const chunksize = (end - start) + 1;
      
      const rangeFile = await c.env.MEDIA_BUCKET.get(r2Key, {
        range: { offset: start, length: chunksize }
      });

      if (rangeFile) {
        headers.set('Content-Range', `bytes ${start}-${end}/${file.size}`);
        headers.set('Content-Length', chunksize.toString());
        return new Response((rangeFile as R2ObjectBody).body, {
          status: 206,
          headers,
        });
      }
    }

    headers.set('Content-Length', file.size.toString());
    return new Response((file as R2ObjectBody).body, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    return c.text('Streaming Error: ' + error.message, 500);
  }
};

app.get('/stream/:id', streamHandler);
app.get('/api/stream/:id', streamHandler);

export default app;
