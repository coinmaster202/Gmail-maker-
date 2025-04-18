// File: /api/ai-assistant.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { message } = req.body;
  if (!message || message.length > 500) {
    return res.status(400).json({ error: "Invalid message" });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a fun, friendly assistant for the One Two Gmail Tool. Only answer questions about Gmail dot variations, fake email generation, CSV export, access codes, and this specific web tool. If asked unrelated stuff, politely refuse and joke about it. Keep your tone casual and cool."
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await openaiRes.json();

  if (!data.choices || !data.choices[0]) {
    return res.status(500).json({ error: "AI response error" });
  }

  res.status(200).json({ reply: data.choices[0].message.content });
}
