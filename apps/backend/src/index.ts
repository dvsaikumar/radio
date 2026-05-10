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

// Edge-Proxied Range Streaming from R2
app.get('/stream/:id', async (c) => {
  const id = c.req.param('id');
  
  // Fetch track metadata to get R2 key
  const track = await c.env.DB.prepare('SELECT r2_key FROM Tracks WHERE id = ?').bind(id).first();
  
  if (!track || !track.r2_key) {
    return c.notFound();
  }

  const range = c.req.header('range');
  
  // Only handle GET and HEAD requests
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    return c.text('Method Not Allowed', 405);
  }

  try {
    let file: R2Object | R2ObjectBody | null;

    if (range) {
      file = await c.env.MEDIA_BUCKET.get(track.r2_key as string, {
        range: c.req.raw.headers,
        onlyIf: c.req.raw.headers,
      });
    } else {
      file = await c.env.MEDIA_BUCKET.get(track.r2_key as string);
    }

    if (file === null) {
      return c.notFound();
    }

    const headers = new Headers();
    file.writeHttpMetadata(headers);
    headers.set('etag', file.httpEtag);
    headers.set('Accept-Ranges', 'bytes');

    if ('range' in file && file.range) {
        // R2 automatically handles the range requests and returns a 206
        // But Hono might need us to return the raw response
        const response = new Response((file as R2ObjectBody).body, {
            status: 206,
            headers,
        });
        return response;
    }

    return new Response((file as R2ObjectBody).body, {
      headers,
    });
  } catch (error) {
    return c.text('Internal Server Error', 500);
  }
});

export default app;
