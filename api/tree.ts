import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory global store across serverless warm instances + KV fallback
let cachedTree: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Return shared tree data from cloud store or KV
  if (req.method === 'GET') {
    // If Upstash Redis or Vercel KV environment variables are present, read from cloud
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (kvUrl && kvToken) {
      try {
        const response = await fetch(`${kvUrl}/get/family_tree_data`, {
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        const json = await response.json();
        if (json && json.result) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          return res.status(200).json(parsed);
        }
      } catch (err) {
        console.warn('Error reading from KV:', err);
      }
    }

    if (cachedTree) {
      return res.status(200).json(cachedTree);
    }

    return res.status(404).json({ error: 'No cloud database data found yet' });
  }

  // POST: Persist changes to shared cloud store
  if (req.method === 'POST') {
    const data = req.body;
    if (!data || !data.people || !Array.isArray(data.people)) {
      return res.status(400).json({ error: 'Invalid family tree format' });
    }

    cachedTree = data;

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (kvUrl && kvToken) {
      try {
        await fetch(`${kvUrl}/set/family_tree_data`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.warn('Error persisting to cloud KV:', err);
      }
    }

    return res.status(200).json({ success: true, count: data.people.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
