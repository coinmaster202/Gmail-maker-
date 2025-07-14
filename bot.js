import TelegramBot from 'node-telegram-bot-api';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const confirmClear = new Set();

bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, `👋 Hello ${msg.from.first_name}! You can use:

/add code mode  
/view  
/clear + /confirm`);
});

bot.onText(/\/add (.+)/, async (msg, match) => {
  const [code, mode] = match[1].split(" ");
  if (!code || !mode) return bot.sendMessage(msg.chat.id, "Usage: /add <code> <mode>");
  try {
    await redis.set(`code:${code}`, mode);
    bot.sendMessage(msg.chat.id, `✅ Code "${code}" added with mode "${mode}"`);
  } catch {
    bot.sendMessage(msg.chat.id, "❌ Failed to add code");
  }
});

bot.onText(/\/view/, async msg => {
  try {
    const keys = await redis.keys("code:*");
    if (keys.length === 0) return bot.sendMessage(msg.chat.id, "📭 No codes in Redis.");
    const list = await Promise.all(keys.map(async key => {
      const mode = await redis.get(key);
      return `${key.replace("code:", "")} → ${mode}`;
    }));
    bot.sendMessage(msg.chat.id, `📦 Codes:\n${list.join("\n")}`);
  } catch {
    bot.sendMessage(msg.chat.id, "❌ Error loading codes.");
  }
});

bot.onText(/\/clear/, msg => {
  confirmClear.add(msg.chat.id);
  bot.sendMessage(msg.chat.id, "⚠️ Are you sure? Send /confirm to delete ALL codes.");
});

bot.onText(/\/confirm/, async msg => {
  if (!confirmClear.has(msg.chat.id)) return bot.sendMessage(msg.chat.id, "Nothing to confirm.");
  try {
    const keys = await redis.keys("code:*");
    await Promise.all(keys.map(k => redis.del(k)));
    confirmClear.delete(msg.chat.id);
    bot.sendMessage(msg.chat.id, "✅ All codes deleted.");
  } catch {
    bot.sendMessage(msg.chat.id, "❌ Failed to clear codes.");
  }
});