const ACCESS_CODES = {
  '2025': 'master',
  '1234': 'standard',
  'dickhead': 'rainbow'
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { code } = req.body;

  if (!code || !ACCESS_CODES[code]) {
    return res.status(200).json({ valid: false });
  }

  return res.status(200).json({
    valid: true,
    mode: ACCESS_CODES[code]
  });
}