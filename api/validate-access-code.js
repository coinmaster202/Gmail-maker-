import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
  if (!code) return res.status(400).json({ valid: false });

  // Permanent codes
  if (permanentCodes[code]) {
    return res.status(200).json({ valid: true, mode: permanentCodes[code] });
  }

  // One-time codes from Supabase
  const { data, error } = await supabase
    .from('one_time_codes')
    .select('mode')
    .eq('code', code)
    .single();

  if (!data || error) {
    return res.status(200).json({ valid: false });
  }

  // Delete code after first successful use
  await supabase.from('one_time_codes').delete().eq('code', code);

  return res.status(200).json({ valid: true, mode: data.mode });
}