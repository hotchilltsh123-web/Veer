// ==========================================
// SHIVAM OS - Non-Stop Hyper-Speed Manager 24/7
// ==========================================

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const ADMIN_IDS = [7353293313]; 
const STATE_FILE = "state.json";

// All 6 Active Embedded Bot Tokens[span_0](start_span)[span_0](end_span)
const BOT_TOKENS = [
  "9105219431:AAH7IrYVrfQFnKtYTM0cj-aGUJO_70-Kotk",
  "9276513885:AAHF6nZayrVqB9DdpFyJLjIrloOLAAvN3mY",
  "8522472818:AAGLz7E05HzQgQL0rL5W88z1mL35tmDeQuE",
  "9137305740:AAFmHKK6mDbdOonIFCBfvKFVdK6LrQlGGRE",
  "9022230980:AAEtu53LGMcaX_yGx4FFDC8ZrzF_m3OUj3o",
  "9208484742:AAFT_aoWEUzhesQU5bRYpBstdNhyCBXo5OI"
];

let chatState = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE))
  : {
      admins: [7353293313], 
      delay: { raid: 400, nc: 400, spam: 400, reply: 400 }, // Safe optimized delay to prevent flood block
    };

const EMOJI_SETS = [
  ["😹","🕸️","😁","🧊","🌊"],
  ["🤩","✨","🙀","💦","😩"],
  ["🫣","🌪️","👻","👽","🌀"],
  ["🌬️","⚡","🌠","🕷️","🦋"],
  ["💥","🔥","👑","☠️","⚡"],
  ["☣️","🛑","🚨","⚡","🐺"]
];

const DEFAULT_RAID_TEXTS = [
  "᭄𝒌𝒎𝒋𝒐𝒓 𝒓𝒂𝒏𝒅𝒊𝒌𝒆 𝒃𝒄𝒉𝒆 𝒄𝒉𝒍 𝒂𝒑𝒏𝒊 𝒃𝒉𝒆𝒏 𝒌𝒊 𝒌𝒂𝒍𝒊 𝒄𝒉𝒖𝒕 𝒅𝒊𝒌𝒉𝒂 ✰",
  "Tmkb M Chappal pdnge Rndyke 😂👍🏻😂👍🏻😂👍🏻😂👍🏻 ",
  "𝑐ℎ𝑙 𝑡𝑟𝑖𝑚𝑎 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑠𝑏𝑠𝑒 𝑏𝑑𝑖 𝑤𝑎𝑙𝑖 𝑟𝑛𝑑𝑖 𝑡𝑟𝑖𝑚𝑎 😹😹",
  "Try mom chudke bolt𝑖 तितली बन उड 𝑗𝑎𝑢🦋🦋🦋🦋🦋 ",
  "⚡ SHIVAM OS HYPER-ATTACK ACTIVE! ⚡",
  "Tera Baap Aaya Rndyke Bhag Yahan Se 🚀🚀"
];

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(chatState));
  } catch (e) {}
}

function isAdmin(userId) {
  if (!userId) return false;
  const numId = Number(userId);
  return ADMIN_IDS.includes(numId) || 
         (chatState.admins && chatState.admins.includes(numId)) ||
         (chatState.sudo && chatState.sudo.includes(numId));
}

function escapeMarkdown(text) {
  return String(text).replace(/([_\*\[\]\(\)\~\>\#\+\-\=\|\{\}\.\!`])/g, "\\$1");
}

function mentionFromUserObj(user) {
  if (!user) return "Unknown";
  const exactName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";
  return `[${escapeMarkdown(exactName)}](tg://user?id=${user.id})`;
}

function parseUserRefArg(arg) {
  if (!arg) return null;
  const md = arg.match(/^\[(.+?)\]\(tg:\/\/user\?id=(\d+)\)$/);
  if (md) return { id: Number(md[2]), nameText: md[1] };
  const tg = arg.match(/^tg:\/\/user\?id=(\d+)$/);
  if (tg) return { id: Number(tg[1]), nameText: null };
  if (/^\d+$/.test(arg)) return { id: Number(arg), nameText: null };
  if (arg.startsWith("@")) return { id: null, nameText: arg };
  return null;
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
    } catch (e) {}
  }
}

async function fetchDisplayName(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    const u = member.user;
    return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "User";
  } catch (e) {
    return "User";
  }
}

function ensureChatState(chatId) {
  chatState[chatId] = chatState[chatId] || {};
  return chatState[chatId];
}

process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});

// ---------- NON-STOP MULTI-BOT SYSTEM ----------
BOT_TOKENS.forEach((token, botIndex) => {
  if (!token) return;

  const bot = new TelegramBot(token, { 
    polling: {
      interval: 100,
      autoStart: true,
      params: { timeout: 10 }
    } 
  });

  console.log(`🚀 Non-Stop Bot ${botIndex + 1} initialized.`);

  bot.getMe().then((info) => {
    bot.botInfo = info;
  }).catch(() => {});

  bot.on("polling_error", (error) => {
    if (error.code === "ETELEGRAM" && error.message.includes("409 Conflict")) return;
  });

  // Name Change Loop
  setInterval(async () => {
    try {
      const emojiSet = EMOJI_SETS[botIndex % EMOJI_SETS.length];
      for (const chatIdStr of Object.keys(chatState)) {
        const cs = chatState[chatIdStr];
        if (cs && cs.nc && cs.nc.texts && cs.nc.texts.length) {
          const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
          const text = cs.nc.texts[Math.floor(Math.random() * cs.nc.texts.length)];
          try { await bot.setChatTitle(Number(chatIdStr), `${emoji} ${text}`); } catch (e) {}
        }
      }
    } catch (e) {}
  }, (chatState.delay && chatState.delay.nc) || 400);

  // Non-Stop Safe Spam Loop (Bot 1) - Prevents Telegram Flood Ban
  if (botIndex === 0) {
    setInterval(async () => {
      try {
        for (const chatIdStr of Object.keys(chatState)) {
          const chatId = Number(chatIdStr);
          const cs = chatState[chatIdStr];
          
          if (cs && cs.spam && cs.spam.remaining > 0) {
            const spam = cs.spam;
            try {
              await safeSendMessage(bot, chatId, escapeMarkdown(spam.text), null);
              cs.spam.remaining -= 1;
              if (cs.spam.remaining <= 0) {
                await safeSendMessage(bot, chatId, "🚫 Spam sequence finished successfully.", null);
                cs.spam = null;
              }
              saveState();
            } catch (e) {
              // Error aane par bhi spam ko crash nahi hone denge, bas skip karenge
            }
          } else if (cs && cs.spam && cs.spam.remaining <= 0) {
              cs.spam = null;
              saveState();
          }
        }
      } catch (e) {}
    }, (chatState.delay && chatState.delay.spam) || 400);
  }

  // Command & Message Handler
  bot.on("message", async (msg) => {
    if (!msg || !msg.chat) return;
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const fromId = msg.from && msg.from.id ? Number(msg.from.id) : null;
    const isFromBot = msg.from && bot.botInfo && msg.from.id === bot.botInfo.id;

    ensureChatState(chatId);

    if (text.startsWith("!")) {
      const parts = text.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (!isAdmin(fromId)) return;

      switch (cmd) {
        case "!help":
          const helpText = "*🚀 SHIVAM OS NON-STOP COMMANDS:*\n" +
            "!raid <target> [text]\n" +
            "!draid\n" +
            "!nc <text1 | text2>\n" +
            "!dnc\n" +
            "!spam <text> <count>\n" +
            "!dspam\n" +
            "!reply <text>\n" +
            "!dreply\n";
          await safeSendMessage(bot, chatId, helpText, msg);
          break;

        case "!raid": {
          let target = null;
          let targetArgsOffset = 0;
          if (msg.reply_to_message && msg.reply_to_message.from) {
            target = { id: Number(msg.reply_to_message.from.id), userObj: msg.reply_to_message.from };
          } else if (args.length >= 1) {
            const parsed = parseUserRefArg(args[0]);
            if (parsed && parsed.id) {
              const display = await fetchDisplayName(bot, chatId, parsed.id);
              target = { id: parsed.id, userObj: { id: parsed.id, first_name: display } };
              targetArgsOffset = 1;
            }
          }
          if (!target) {
            await safeSendMessage(bot, chatId, "⚠️ Provide target user!", msg);
            break;
          }
          let raidText = args.slice(targetArgsOffset).join(" ").trim() || DEFAULT_RAID_TEXTS[Math.floor(Math.random() * DEFAULT_RAID_TEXTS.length)];
          chatState[chatId].raid = { raidText, target };
          saveState();
          await safeSendMessage(bot, chatId, `🔥 Raid activated!`, msg);
          break;
        }

        case "!draid":
          chatState[chatId].raid = null;
          saveState();
          await safeSendMessage(bot, chatId, "🔥 Raid stopped.", msg);
          break;

        case "!nc": {
          const rest = args.join(" ").trim();
          if (!rest) {
            await safeSendMessage(bot, chatId, "⚠️ Usage: !nc text1 | text2", msg);
            break;
          }
          const texts = rest.split("|").map(s => s.trim()).filter(Boolean);
          chatState[chatId].nc = { texts };
          saveState();
          await safeSendMessage(bot, chatId, `⚡ NC started!`, msg);
          break;
        }

        case "!dnc":
          chatState[chatId].nc = null;
          saveState();
          await safeSendMessage(bot, chatId, `⚡ NC stopped.`, msg);
          break;

        case "!spam": {
          if (args.length < 2) {
            await safeSendMessage(bot, chatId, "⚠️ Usage: !spam <text> <count>", msg);
            break;
          }
          const count = Number(args[args.length - 1]);
          const spamText = args.slice(0, -1).join(" ").trim();
          if (isNaN(count) || count <= 0 || !spamText) break;
          chatState[chatId].spam = { text: spamText, remaining: count, total: count };
          saveState();
          await safeSendMessage(bot, chatId, `🗣️ Spam started for ${count} messages.`, msg);
          break;
        }

        case "!dspam":
          chatState[chatId].spam = null;
          saveState();
          await safeSendMessage(bot, chatId, `🚫 Spam stopped manually.`, msg);
          break;

        case "!reply": {
          const replyText = args.join(" ").trim();
          if (!replyText) break;
          chatState[chatId].reply = { text: replyText };
          saveState();
          await safeSendMessage(bot, chatId, `🔁 Auto-reply enabled.`, msg);
          break;
        }

        case "!dreply":
          chatState[chatId].reply = null;
          saveState();
          await safeSendMessage(bot, chatId, `🚫 Auto-reply stopped.`, msg);
          break;

        default:
          break;
      }
      return;
    }

    const state = chatState[chatId] || {};
    const delay = Object.assign({ raid: 400, nc: 400, spam: 400, reply: 400 }, chatState.delay);

    if (isFromBot) return;

    if (state.raid && state.raid.target) {
      const t = state.raid.target;
      let targetId = t?.userObj?.id ? Number(t.userObj.id) : (t?.id ? Number(t.id) : null);
      if (targetId && msg.from && Number(msg.from.id) === targetId) {
        const mentionClickable = mentionFromUserObj(msg.from);
        setTimeout(() => safeSendMessage(bot, chatId, `${mentionClickable} ${escapeMarkdown(state.raid.raidText)}`, msg), delay.raid);
      }
    }
    
    if (state.reply && state.reply.text) {
      setTimeout(async () => {
        try { await safeSendMessage(bot, chatId, state.reply.text, msg); } catch (e) {}
      }, delay.reply);
    }
  });
});
