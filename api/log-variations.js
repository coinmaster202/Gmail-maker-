import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers so frontend requests are allowed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Reject all non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { emails, username, accessCode } = req.body;

  if (!emails || !username || !accessCode) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const emailBody = emails.join('\n');
    const timestamp = new Date().toLocaleString();

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'livuapp900@gmail.com',
      subject: `Gmail Variations Generated by ${username}`,
      text: `
Access Code: ${accessCode}
Username: ${username}
Total Variations: ${emails.length}
Timestamp: ${timestamp}

Emails:
${emailBody}
      `.trim()
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Email failed' });
  }
}
