import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Permanent codes that never expire
const permanentCodes = {
  '2025': 'master',
  '1234': 'standard',
  'thebest': 'rainbow'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { code } = req.body;

  console.log("Access code received:", code);

  if (!code) return res.status(400).json({ valid: false });

  // Check permanent codes
  if (permanentCodes[code]) {
    console.log("Matched permanent code:", code);
    return res.status(200).json({ valid: true, mode: permanentCodes[code] });
  }

  try {
    const mode = await redis.get(`code:${code}`);
    if (!mode) {
      console.log("Code not found or already used.");
      return res.status(200).json({ valid: false });
    }

    // Delete after first use
    await redis.del(`code:${code}`);
    console.log("Used and deleted one-time code:", code);

    return res.status(200).json({ valid: true, mode });
  } catch (err) {
    console.error("Redis error:", err);
    return res.status(500).json({ error: 'Redis error' });
  }
}