import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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

  // ✅ Check permanent codes
  if (permanentCodes[code]) {
    return res.status(200).json({ valid: true, mode: permanentCodes[code] });
  }

  // ✅ Check Supabase one-time codes
  const { data, error } = await supabase
    .from('one_time_codes')
    .select('mode')
    .eq('code', code)
    .single();

  if (error || !data) {
    return res.status(200).json({ valid: false });
  }

  // ✅ Delete after first use
  await supabase.from('one_time_codes').delete().eq('code', code);

  // Return the one-time code's mode (v200, v500, v1000, unlimited)
  return res.status(200).json({
    valid: true,
    mode: data.mode
  });
}
