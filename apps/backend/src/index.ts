import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health check
app.get('/', (c) => c.text('Radio Edge API is running!'));

// Get all tracks from D1
app.get('/api/tracks', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Tracks ORDER BY created_at DESC').all();
  return c.json({ tracks: results });
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
