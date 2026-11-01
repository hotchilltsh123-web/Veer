// og.js - 24/7 Background Telegram Bot Manager
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const gTTS = require("gtts");

// ---------- CONFIG ----------
const STATE_FILE = "state.json";
const TOKENS_FILE = "tokens.txt";
const MAX_BOTS = 20;

let chatState = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE))
  : {
      admins: [8369554785, 6580991809], 
      delay: { raid: 2000, nc: 2000, vn: 2000, spam: 2000, reply: 2000 },
    };

let BOT_TOKENS = [];
try {
  if (fs.existsSync(TOKENS_FILE)) {
    BOT_TOKENS = fs.readFileSync(TOKENS_FILE, "utf8")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, MAX_BOTS);
  } else {
    console.warn(${TOKENS_FILE} not found - please add your tokens.);
  }
} catch (e) {
  console.error("Failed to read tokens file:", e?.message);
}

const EMOJI_SETS = [
  ["😹","🕸️","😁","🧊","🌊"],
  ["🤩","✨","🙀","💦","😩"],
  ["🫣","🌪️","👻","👽","🌀"],
  ["🌬️","⚡","🌠","🕷️","🦋"],
  ["❤️","💙","💚","💛","💜"],
];

const DEFAULT_RAID_TEXTS = [
  "᭄𝒌𝒎𝒋𝒐𝒓 𝒓𝒂𝒏𝒅𝒊𝒌𝒆 𝒃𝒄𝒉𝒆 𝒄𝒉𝒍 𝒂𝒑𝒏𝒊 𝒃𝒉𝒆𝒏 𝒌𝒊 𝒌𝒂𝒍𝒊 𝒄𝒉𝒖𝒕 𝒅𝒊𝒌𝒉𝒂 ✰",
  "Tmkb M Chappal pdnge Rndyke 😂👍🏻😂👍🏻😂👍🏻😂👍🏻 ",
  "𝑐ℎ𝑙 𝑡𝑟𝑖𝑚𝑎 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑠𝑏𝑠𝑒 𝑏𝑑𝑖 𝑤𝑎𝑙𝑖 𝑟𝑛𝑑𝑖 𝑡𝑟𝑖𝑚𝑎 😹😹",
  "Try mom chudke bolt𝑖 तितली बन उड 𝑗𝑎𝑢🦋🦋🦋🦋🦋 ",
  "𝘵𝘦𝘳𝘪 𝘮𝘢 𝘬𝘢𝘳𝘢𝘯 𝘈𝘶𝘫𝘭𝘢 𝘬𝘦 𝘨𝘢𝘯𝘦 𝘱𝘦 𝘤udengi ~ᵐᵃʰᵒˡ ᵖᵘʳᵃ ʷᵃᵛʸ 🎶😂👌🏻 "
];

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(chatState, null, 2));
  } catch (e) {
    console.error("Failed saving state:", e.message);
  }
}

function isAdmin(userId) {
  return (chatState.admins && chatState.admins.includes(Number(userId))) ||
         (chatState.sudo && chatState.sudo.includes(Number(userId)));
}

function escapeMarkdown(text) {
  return String(text).replace(/([_\*\[\]\(\)\~\>\#\+\-\=\|\{\}\.\!])/g, "\\$1");
}

async function safeSendMessage(bot, chatId, text, replyToMsg, opts = {}) {
  const options = Object.assign({ parse_mode: "Markdown" }, opts); 
  try {
    if (replyToMsg && replyToMsg.message_id) {
      options.reply_to_message_id = replyToMsg.message_id;
    }
    return await bot.sendMessage(chatId, text, options);
  } catch (err) {
    try {
      const { reply_to_message_id, ...fallback } = options;
      return await bot.sendMessage(chatId, text, fallback);
    } catch (e) {
      console.error("safeSendMessage failed:", e.message);
    }
  }
}

process.on("unhandledRejection", (r) => {
  console.error("UnhandledRejection:", r?.stack || r);
});

// ---------- START BOTS ----------
BOT_TOKENS.forEach((token, botIndex) => {
  if (!token) return;
  const bot = new TelegramBot(token, { polling: true });
  console.log(Bot ${botIndex + 1} started successfully in background.`);

  bot.getMe().then((info) => {
    bot.botInfo = info;
  }).catch(() => {});

  bot.on("message", async (msg) => {
    if (!msg || !msg.chat) return;
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const fromId = msg.from?.id ? Number(msg.from.id) : null;

    if (text.startsWith("!") && isAdmin(fromId)) {
      const parts = text.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      
      if (cmd === "!ping") {
        await safeSendMessage(bot, chatId, "🤖 SHIVAM OS Background Worker is Active & Running 24/7!", msg);
      }
    }
  });
});
