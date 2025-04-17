import { createClient } from '@supabase/supabase-js';

// Connect to Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Permanent (non-deletable) access codes
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

  if (!code) {
    console.log("No code provided");
    return res.status(400).json({ valid: false });
  }

  // Check permanent codes
  if (permanentCodes[code]) {
    console.log("Matched permanent code:", code, "→", permanentCodes[code]);
    return res.status(200).json({ valid: true, mode: permanentCodes[code] });
  }

  // Check Supabase for one-time code
  const { data, error } = await supabase
    .from('one_time_codes')
    .select('mode')
    .eq('code', code)
    .single();

  console.log("Supabase response:", { data, error });

  if (!data || error) {
    console.log("Code not found or error occurred.");
    return res.status(200).json({ valid: false });
  }

  // Delete code after first use
  await supabase.from('one_time_codes').delete().eq('code', code);
  console.log("One-time code used and deleted:", code);

  return res.status(200).json({ valid: true, mode: data.mode });
}